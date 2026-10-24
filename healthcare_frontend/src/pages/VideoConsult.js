import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useContext } from "react";
import API from "../services/api";
import CarelinePageHeader from "../components/CarelinePageHeader";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/video.css";

const SIGNAL_URL = process.env.REACT_APP_WS_URL || `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8000`;
const QUALITY_INTERVAL_MS = 4000;
const RECONNECT_TIMEOUT_MS = 18000;

function formatClock(totalSeconds) {
    return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function VideoConsult() {
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const [consultation, setConsultation] = useState(null);
    const [status, setStatus] = useState("Preparing your consultation");
    const startSessionRef = useRef(null);
    const [connectionState, setConnectionState] = useState("connecting");
    const [quality, setQuality] = useState("Waiting for connection");
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
    const [audioOnly, setAudioOnly] = useState(false);
    const [remoteMediaState, setRemoteMediaState] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatMessage, setChatMessage] = useState("");
    const [notes, setNotes] = useState("");
    const [seconds, setSeconds] = useState(0);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [retryAvailable, setRetryAvailable] = useState(false);
    const [preflightReady, setPreflightReady] = useState(false);
    const [preflightBusy, setPreflightBusy] = useState(false);
    const [callStarted, setCallStarted] = useState(false);
    const [remoteMediaReady, setRemoteMediaReady] = useState(false);
    const [panelOpen, setPanelOpen] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const localVideo = useRef(null);
    const remoteVideo = useRef(null);
    const stageRef = useRef(null);
    const streamRef = useRef(null);
    const peerRef = useRef(null);
    const videoSenderRef = useRef(null);
    const socketRef = useRef(null);
    const heartbeatTimerRef = useRef(null);
    const socketAuthorizedRef = useRef(false);
    const outboundSignalQueueRef = useRef([]);
    const pendingChatRef = useRef("");
    const consultationRef = useRef(null);
    const rtcConfigurationRef = useRef({ iceServers: [] });
    const startedAtRef = useRef(null);
    const durationTimerRef = useRef(null);
    const cleanupRef = useRef(false);
    const explicitlyEndedRef = useRef(false);
    const makingOfferRef = useRef(false);
    const ignoredOfferRef = useRef(false);
    const pendingIceRef = useRef([]);
    const reconnectingRef = useRef(false);
    const retryCountRef = useRef(0);
    const recoveryTimerRef = useRef(null);
    const qualityTimerRef = useRef(null);
    const lastStatsRef = useRef(null);
    const weakSamplesRef = useRef(0);
    const goodSamplesRef = useRef(0);
    const bitrateReducedRef = useRef(false);
    const audioOnlyRef = useRef(false);
    const cameraEnabledRef = useRef(true);
    const microphoneEnabledRef = useRef(true);
    const callerRef = useRef(false);
    const mountedRef = useRef(true);

    const clearRecoveryTimer = () => {
        if (recoveryTimerRef.current) {
            window.clearTimeout(recoveryTimerRef.current);
            recoveryTimerRef.current = null;
        }
    };

    const sendSignal = (payload) => {
        const socket = socketRef.current;
        if (socket?.readyState === WebSocket.OPEN && socketAuthorizedRef.current) socket.send(JSON.stringify(payload));
        else outboundSignalQueueRef.current.push(payload);
    };

    const stopMedia = () => {
        streamRef.current?.getTracks().forEach((track) => {
            track.onended = null;
            track.stop();
        });
        streamRef.current = null;
        if (localVideo.current) localVideo.current.srcObject = null;
    };

    const closePeer = () => {
        const peer = peerRef.current;
        if (!peer) return;
        peer.onicecandidate = null;
        peer.ontrack = null;
        peer.onconnectionstatechange = null;
        peer.oniceconnectionstatechange = null;
        peer.onnegotiationneeded = null;
        peer.close();
        peerRef.current = null;
        videoSenderRef.current = null;
        pendingIceRef.current = [];
    };

    const requestMedia = async ({ video }) => {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("This browser does not support camera and microphone access.");
        }
        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: video ? { width: { ideal: 640, max: 1280 }, height: { ideal: 360, max: 720 }, frameRate: { ideal: 15, max: 24 } } : false,
            });
        } catch (mediaError) {
            if (video && ["NotFoundError", "OverconstrainedError", "NotReadableError"].includes(mediaError.name)) {
                setNotice("Camera unavailable. Joining in audio-only mode.");
                setAudioOnly(true);
                audioOnlyRef.current = true;
                setCameraEnabled(false);
                cameraEnabledRef.current = false;
                try {
                    return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
                } catch (audioError) {
                    throw new Error(audioError.name === "NotAllowedError" ? "Microphone permission was denied. Allow microphone access and retry." : "No microphone was found. Connect a microphone and retry.");
                }
            }
            if (video && mediaError.name === "NotAllowedError") {
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
                    setNotice("Camera permission was denied. Joined in audio-only mode.");
                    setAudioOnly(true);
                    audioOnlyRef.current = true;
                    setCameraEnabled(false);
                    cameraEnabledRef.current = false;
                    return audioStream;
                } catch (audioError) {
                    throw new Error("Microphone permission was denied. Allow microphone access and retry.");
                }
            }
            if (mediaError.name === "NotAllowedError" || mediaError.name === "SecurityError") {
                throw new Error("Camera or microphone permission was denied. Allow access in your browser settings and retry.");
            }
            if (mediaError.name === "NotFoundError") throw new Error("No camera or microphone was found. Connect a device and retry.");
            if (mediaError.name === "NotReadableError") throw new Error("The camera or microphone is already in use by another application.");
            throw new Error(mediaError.message || "Could not access camera or microphone.");
        }
    };

    const attachLocalTracks = (peer, stream) => {
        const senders = peer.getSenders();
        stream.getTracks().forEach((track) => {
            if (!senders.some((sender) => sender.track?.kind === track.kind)) {
                const sender = peer.addTrack(track, stream);
                if (track.kind === "video") videoSenderRef.current = sender;
            }
        });
        videoSenderRef.current ||= peer.getSenders().find((sender) => sender.track?.kind === "video") || null;
    };

    const createPeer = () => {
        if (peerRef.current && peerRef.current.signalingState !== "closed") return peerRef.current;
        const peer = new RTCPeerConnection(rtcConfigurationRef.current);
        attachLocalTracks(peer, streamRef.current);
        peer.onicecandidate = ({ candidate }) => {
            if (candidate) sendSignal({ type: "ice", candidate: candidate.toJSON() });
        };
        peer.ontrack = ({ streams }) => {
            if (!remoteVideo.current || !streams[0]) return;
            remoteVideo.current.srcObject = streams[0];
            setRemoteMediaReady(true);
            remoteVideo.current.play().catch(() => {});
            setStatus("Remote media received");
        };
        peer.onconnectionstatechange = () => {
            const next = peer.connectionState;
            if (!mountedRef.current) return;
            setConnectionState(next);
            if (next === "connected") {
                setStatus("Connected");
                setRetryAvailable(false);
                retryCountRef.current = 0;
                reconnectingRef.current = false;
                clearRecoveryTimer();
                startQualityMonitor(peer);
            } else if (next === "connecting") {
                setStatus("Connecting to the other participant");
            } else if (next === "disconnected") {
                setStatus("Connection interrupted. Attempting to reconnect");
                scheduleRecovery(peer);
            } else if (next === "failed") {
                setStatus("Connection failed");
                scheduleRecovery(peer, true);
            } else if (next === "closed" && !explicitlyEndedRef.current) {
                setStatus("Call disconnected");
            }
        };
        peer.oniceconnectionstatechange = () => {
            if (["disconnected", "failed"].includes(peer.iceConnectionState) && !explicitlyEndedRef.current) {
                scheduleRecovery(peer, peer.iceConnectionState === "failed");
            }
        };
        peer.onnegotiationneeded = async () => {
            if (!callerRef.current || makingOfferRef.current || peer.signalingState !== "stable") return;
            try {
                makingOfferRef.current = true;
                await peer.setLocalDescription(await peer.createOffer());
                sendSignal({ type: "offer", offer: peer.localDescription });
            } catch (negotiationError) {
                setError("Could not start the video connection. Use Retry to try again.");
            } finally {
                makingOfferRef.current = false;
            }
        };
        peerRef.current = peer;
        return peer;
    };

    const flushPendingIce = async (peer) => {
        if (!peer.remoteDescription) return;
        const pending = pendingIceRef.current.splice(0);
        for (const candidate of pending) {
            try { await peer.addIceCandidate(candidate); } catch (iceError) { /* stale candidate during renegotiation */ }
        }
    };

    const handleSignal = async (payload) => {
        if (!payload || typeof payload.type !== "string") return;
        if (payload.type === "authenticated") {
            socketAuthorizedRef.current = true;
            const queued = outboundSignalQueueRef.current.splice(0);
            queued.forEach((signal) => sendSignal(signal));
            setStatus("Waiting for the other participant");
            return;
        }
        if (payload.type === "heartbeat_ack") return;
        if (payload.type === "chat_sent") {
            const text = pendingChatRef.current;
            if (text) {
                setMessages((current) => [...current, { text, own: true, sender: "you", timestamp: payload.timestamp }]);
                pendingChatRef.current = "";
                setChatMessage("");
            }
            return;
        }
        if (payload.type === "error") {
            setError(payload.message || "The signaling server rejected the message.");
            return;
        }
        if (payload.type === "peer_joined") {
            if (payload.participant_id === user?.id) return;
            if (callerRef.current) {
                const peer = createPeer();
                if (peer.signalingState === "stable") {
                    try {
                        makingOfferRef.current = true;
                        await peer.setLocalDescription(await peer.createOffer());
                        sendSignal({ type: "offer", offer: peer.localDescription });
                    } catch (offerError) {
                        setError("Could not start the video connection. Use Retry to try again.");
                    } finally {
                        makingOfferRef.current = false;
                    }
                }
            }
            return;
        }
        if (payload.type === "peer_left") {
            setStatus("The other participant disconnected. Waiting for them to return");
            setConnectionState("disconnected");
            setRemoteMediaReady(false);
            if (remoteVideo.current) remoteVideo.current.srcObject = null;
            scheduleRecovery(peerRef.current);
            return;
        }
        if (payload.type === "media_state") {
            setRemoteMediaState({ camera: payload.camera, microphone: payload.microphone });
            return;
        }
        if (payload.type === "chat") {
            if (payload.participant_id !== user?.id) {
                setMessages((current) => [...current, { text: payload.text, own: false, sender: payload.role || "participant", timestamp: payload.timestamp || new Date().toISOString() }]);
            }
            return;
        }
        if (payload.type === "call_ended") {
            explicitlyEndedRef.current = true;
            clearRecoveryTimer();
            if (qualityTimerRef.current) window.clearInterval(qualityTimerRef.current);
            if (heartbeatTimerRef.current) window.clearInterval(heartbeatTimerRef.current);
            closePeer();
            stopMedia();
            socketRef.current?.close(1000, "peer ended call");
            setStatus("The other participant left the consultation");
            setConnectionState("closed");
            return;
        }
        const peer = createPeer();
        if (payload.type === "offer" && payload.offer) {
            const collision = makingOfferRef.current || peer.signalingState !== "stable";
            ignoredOfferRef.current = !callerRef.current && collision;
            if (ignoredOfferRef.current) return;
            try {
                await peer.setRemoteDescription(payload.offer);
                await flushPendingIce(peer);
                await peer.setLocalDescription(await peer.createAnswer());
                sendSignal({ type: "answer", answer: peer.localDescription });
            } catch (offerError) {
                setError("The other participant's connection offer could not be applied.");
            }
        } else if (payload.type === "answer" && payload.answer) {
            try {
                await peer.setRemoteDescription(payload.answer);
                await flushPendingIce(peer);
            } catch (answerError) {
                setError("The connection response could not be applied. Use Retry to try again.");
            }
        } else if (payload.type === "ice" && payload.candidate) {
            if (ignoredOfferRef.current) return;
            try {
                if (peer.remoteDescription) await peer.addIceCandidate(payload.candidate);
                else pendingIceRef.current.push(payload.candidate);
            } catch (iceError) {
                setError("A network candidate could not be applied. The call may reconnect automatically.");
            }
        }
    };

    const openSocket = async (roomId) => {
        const { data } = await API.getConsultationSocketTicket(consultationRef.current.id);
        const wsBase = SIGNAL_URL.replace(/^http/, "ws");
        const socket = new WebSocket(`${wsBase}/ws/consultations/${roomId}/`);
        socketRef.current = socket;
        socketAuthorizedRef.current = false;
        const opened = new Promise((resolve, reject) => {
            let settled = false;
            const timeout = window.setTimeout(() => {
                settle(reject, new Error("Signaling authentication timed out. Check the server connection and retry."));
                socket.close();
            }, 10000);
            const settle = (callback, value) => {
                if (settled) return;
                settled = true;
                window.clearTimeout(timeout);
                callback(value);
            };
            socket.onopen = () => {
                socket.send(JSON.stringify({ type: "authenticate", ticket: data.ticket }));
            };
            socket.onerror = () => {
                settle(reject, new Error("Could not connect to the consultation signaling server."));
            };
            socket.onclose = (event) => {
                socketAuthorizedRef.current = false;
                if (heartbeatTimerRef.current) window.clearInterval(heartbeatTimerRef.current);
                settle(reject, new Error(event.code === 4409 ? "This account is already connected in another consultation tab." : "Signaling connection closed before authorization."));
                if (settled && !explicitlyEndedRef.current && mountedRef.current) {
                    setConnectionState("disconnected");
                    setStatus(event.code === 4409 ? "This account is already connected in another tab" : "Signaling connection closed");
                    scheduleRecovery(peerRef.current);
                }
            };
            socket.onmessage = (event) => {
                let payload;
                try { payload = JSON.parse(event.data); } catch (parseError) { setError("Received an invalid signaling response."); return; }
                if (payload.type === "authenticated") {
                    settle(resolve);
                    if (heartbeatTimerRef.current) window.clearInterval(heartbeatTimerRef.current);
                    heartbeatTimerRef.current = window.setInterval(() => {
                        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "heartbeat" }));
                    }, 25000);
                }
                if (payload.type === "error") settle(reject, new Error(payload.message || "Signaling authorization failed."));
                handleSignal(payload).catch(() => setError("Could not process a signaling update."));
            };
        });
        await opened;
    };

    const startSession = async ({ reconnect = false } = {}) => {
        if (!consultationRef.current || cleanupRef.current || explicitlyEndedRef.current) return;
        setError("");
        setRetryAvailable(false);
        setStatus(reconnect ? "Reconnecting" : "Requesting camera and microphone access");
        if (!streamRef.current) {
            const stream = await requestMedia({ video: cameraEnabledRef.current && !audioOnlyRef.current });
            if (!mountedRef.current || cleanupRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            streamRef.current = stream;
            if (localVideo.current) localVideo.current.srcObject = stream;
        }
        if (reconnect) {
            socketRef.current?.close(4000, "reconnecting");
            socketRef.current = null;
            socketAuthorizedRef.current = false;
            closePeer();
        }
        createPeer();
        outboundSignalQueueRef.current = [];
        await openSocket(consultationRef.current.room_id);
    };
    startSessionRef.current = startSession;

    const scheduleRecovery = (peer, restartIce = false) => {
        if (reconnectingRef.current || explicitlyEndedRef.current || cleanupRef.current) return;
        clearRecoveryTimer();
        reconnectingRef.current = true;
        setStatus("Connection interrupted. Attempting to reconnect");
        recoveryTimerRef.current = window.setTimeout(async () => {
            let restartSent = false;
            try {
                if (retryCountRef.current >= 2) {
                    setStatus("Unable to restore the connection");
                    setConnectionState("failed");
                    setRetryAvailable(true);
                } else if (peer && peer.signalingState !== "closed" && restartIce && peer.restartIce && retryCountRef.current < 1) {
                    peer.restartIce();
                    makingOfferRef.current = true;
                    await peer.setLocalDescription(await peer.createOffer({ iceRestart: true }));
                    sendSignal({ type: "offer", offer: peer.localDescription });
                    makingOfferRef.current = false;
                    restartSent = true;
                    retryCountRef.current += 1;
                } else if (retryCountRef.current < 2) {
                    retryCountRef.current += 1;
                    if (socketRef.current && socketRef.current.readyState !== WebSocket.OPEN) socketRef.current = null;
                    reconnectingRef.current = false;
                    await startSession({ reconnect: true });
                } else {
                    setStatus("Unable to restore the connection");
                    setConnectionState("failed");
                    setRetryAvailable(true);
                }
            } catch (recoveryError) {
                makingOfferRef.current = false;
                retryCountRef.current += 1;
                reconnectingRef.current = false;
                if (retryCountRef.current >= 2) {
                    setStatus("Unable to restore the connection");
                    setConnectionState("failed");
                    setRetryAvailable(true);
                } else {
                    scheduleRecovery(peer, true);
                }
            } finally {
                reconnectingRef.current = false;
                if (restartSent && !explicitlyEndedRef.current) {
                    recoveryTimerRef.current = window.setTimeout(() => {
                        if (peerRef.current?.connectionState !== "connected") scheduleRecovery(peerRef.current, retryCountRef.current >= 2);
                    }, RECONNECT_TIMEOUT_MS);
                }
            }
        }, restartIce ? 800 : 1800);
    };

    const startQualityMonitor = (peer) => {
        if (qualityTimerRef.current) window.clearInterval(qualityTimerRef.current);
        lastStatsRef.current = null;
        qualityTimerRef.current = window.setInterval(async () => {
            if (peerRef.current !== peer || peer.connectionState !== "connected") return;
            try {
                const reports = await peer.getStats();
                let inboundVideo = null;
                let inboundAudio = null;
                let outboundVideo = null;
                let candidatePair = null;
                reports.forEach((report) => {
                    if (report.type === "inbound-rtp" && report.kind === "video" && !report.isRemote) inboundVideo = report;
                    if (report.type === "inbound-rtp" && report.kind === "audio" && !report.isRemote) inboundAudio = report;
                    if (report.type === "outbound-rtp" && report.kind === "video" && !report.isRemote) outboundVideo = report;
                    if (report.type === "candidate-pair" && report.state === "succeeded" && report.nominated) candidatePair = report;
                });
                const previous = lastStatsRef.current;
                const elapsed = previous ? Math.max(.1, (Date.now() - previous.time) / 1000) : 0;
                const lostDelta = previous && inboundVideo ? Math.max(0, inboundVideo.packetsLost - previous.lost) : 0;
                const receivedDelta = previous && inboundVideo ? Math.max(0, inboundVideo.packetsReceived - previous.received) : 0;
                const packetLoss = lostDelta + receivedDelta > 0 ? lostDelta / (lostDelta + receivedDelta) : 0;
                const bitrate = previous && outboundVideo && elapsed ? Math.max(0, (outboundVideo.bytesSent - previous.bytesSent) * 8 / elapsed) : 0;
                const roundTrip = candidatePair?.currentRoundTripTime;
                const jitter = inboundAudio?.jitter;
                const frameRate = outboundVideo?.framesPerSecond;
                const framesDropped = inboundVideo?.framesDropped;
                const droppedDelta = previous && framesDropped != null ? Math.max(0, framesDropped - (previous.framesDropped || 0)) : 0;
                setQuality(`${packetLoss > .12 || (roundTrip || 0) > .6 ? "Weak" : packetLoss > .05 || (roundTrip || 0) > .3 ? "Fair" : "Good"} · ${Math.round(packetLoss * 100)}% loss · ${roundTrip ? `${Math.round(roundTrip * 1000)}ms RTT` : "RTT n/a"} · ${jitter != null ? `${Math.round(jitter * 1000)}ms jitter` : "jitter n/a"} · ${bitrate ? `${Math.round(bitrate / 1000)}kbps` : "bitrate n/a"} · ${frameRate ? `${Math.round(frameRate)}fps` : "fps n/a"}${droppedDelta ? ` · ${droppedDelta} frames interrupted` : ""}`);
                lastStatsRef.current = {
                    time: Date.now(),
                    lost: inboundVideo?.packetsLost || 0,
                    received: inboundVideo?.packetsReceived || 0,
                    bytesSent: outboundVideo?.bytesSent || 0,
                    jitter,
                    bitrate,
                    framesDropped,
                };
                if ((packetLoss > .12 || (roundTrip || 0) > .6 || (jitter || 0) > .08) && !audioOnlyRef.current) {
                    weakSamplesRef.current += 1;
                    goodSamplesRef.current = 0;
                } else {
                    weakSamplesRef.current = 0;
                    if (packetLoss < .04 && (roundTrip || 0) < .25) goodSamplesRef.current += 1;
                    else goodSamplesRef.current = 0;
                }
                if (weakSamplesRef.current >= 2 && !bitrateReducedRef.current && !audioOnlyRef.current) {
                    await setVideoBitrate(250000);
                    bitrateReducedRef.current = true;
                    setNotice("Network is weak. Video quality has been reduced.");
                }
                if (weakSamplesRef.current >= 5 && !audioOnlyRef.current) setAudioOnlyMode(true, "Network remains weak. Switched to audio-only mode.");
                if (goodSamplesRef.current >= 5 && bitrateReducedRef.current && !audioOnlyRef.current) {
                    await setVideoBitrate(900000);
                    bitrateReducedRef.current = false;
                    setNotice("Connection improved. Video quality restored.");
                }
                if (goodSamplesRef.current >= 5 && audioOnlyRef.current && cameraEnabledRef.current) setNotice("Connection is stable. You can turn your camera back on.");
            } catch (statsError) {
                setQuality("Connected · detailed network stats unavailable in this browser");
            }
        }, QUALITY_INTERVAL_MS);
    };

    const setVideoBitrate = async (maxBitrate) => {
        const sender = videoSenderRef.current;
        if (!sender?.track || !sender.getParameters || !sender.setParameters) return;
        try {
            const parameters = sender.getParameters();
            if (!parameters.encodings?.length) parameters.encodings = [{}];
            parameters.encodings[0].maxBitrate = maxBitrate;
            await sender.setParameters(parameters);
        } catch (parameterError) {
            setNotice("This browser is adapting video quality automatically.");
        }
    };

    const setAudioOnlyMode = async (enabled, message) => {
        if (audioOnlyRef.current === enabled) return;
        audioOnlyRef.current = enabled;
        setAudioOnly(enabled);
        setNotice(message);
        const peer = peerRef.current;
        const videoSender = videoSenderRef.current || peer?.getSenders().find((sender) => sender.track?.kind === "video");
        if (videoSender) videoSenderRef.current = videoSender;
        if (enabled) {
            if (videoSender) await videoSender.replaceTrack(null);
            const audioTracks = streamRef.current?.getAudioTracks() || [];
            streamRef.current?.getVideoTracks().forEach((track) => track.stop());
            streamRef.current = new MediaStream(audioTracks);
            if (localVideo.current) localVideo.current.srcObject = streamRef.current;
        } else {
            try {
                let videoTrack = streamRef.current?.getVideoTracks()[0];
                if (!videoTrack || videoTrack.readyState === "ended") {
                    const videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640, max: 1280 }, height: { ideal: 360, max: 720 } }, audio: false });
                    videoTrack = videoStream.getVideoTracks()[0];
                    const audioTrack = streamRef.current?.getAudioTracks()[0];
                    streamRef.current?.getVideoTracks().forEach((track) => track.stop());
                    streamRef.current = new MediaStream([...(audioTrack ? [audioTrack] : []), videoTrack]);
                    if (localVideo.current) localVideo.current.srcObject = streamRef.current;
                }
                videoTrack.enabled = cameraEnabledRef.current;
                if (videoSender) await videoSender.replaceTrack(videoTrack);
                else if (peer && streamRef.current) videoSenderRef.current = peer.addTrack(videoTrack, streamRef.current);
                if (peer && callerRef.current) {
                    await peer.setLocalDescription(await peer.createOffer());
                    sendSignal({ type: "offer", offer: peer.localDescription });
                }
            } catch (cameraError) {
                audioOnlyRef.current = true;
                setAudioOnly(true);
                setError("Could not restore the camera. Continuing with audio only.");
            }
        }
        sendSignal({ type: "media_state", camera: cameraEnabledRef.current && !audioOnlyRef.current, microphone: microphoneEnabledRef.current });
    };

    useEffect(() => {
        mountedRef.current = true;
        cleanupRef.current = false;
        const appointmentId = searchParams.get("appointment");
        const consultationId = searchParams.get("consultation");
        let cancelled = false;

        const initialize = async () => {
            try {
                let currentConsultation;
                if (consultationId) {
                    const response = await API.getConsultations();
                    currentConsultation = response.data.find((item) => String(item.id) === consultationId);
                    if (!currentConsultation) throw new Error("This consultation was not found or you are not a participant.");
                } else if (appointmentId) {
                    currentConsultation = (await API.createConsultation(appointmentId)).data;
                } else {
                    throw new Error("Open this page from a confirmed appointment to join the consultation.");
                }
                if (cancelled || !mountedRef.current) return;
                if (currentConsultation.ended_at) throw new Error("This consultation has already ended.");
                consultationRef.current = currentConsultation;
                setConsultation(currentConsultation);
                callerRef.current = user?.role === "patient";
                const history = await API.getMessages(currentConsultation.id);
                setMessages(history.data.map((item) => ({
                    text: item.text,
                    own: item.sender?.id === user?.id,
                    sender: item.sender?.first_name || item.sender?.role || "participant",
                    timestamp: item.created_at,
                })));
                rtcConfigurationRef.current = (await API.getConsultationIceConfiguration(currentConsultation.id)).data;
                setConnectionState("new");
                setStatus("Ready for your device check");
            } catch (initializeError) {
                socketRef.current?.close();
                socketRef.current = null;
                socketAuthorizedRef.current = false;
                closePeer();
                stopMedia();
                if (!cancelled && mountedRef.current) {
                    setError(initializeError.response?.data?.error || initializeError.message || "Could not start consultation.");
                    setStatus("Unable to join consultation");
                    setRetryAvailable(true);
                }
            }
        };
        initialize();

        const remoteVideoElement = remoteVideo.current;
        return () => {
            cancelled = true;
            mountedRef.current = false;
            cleanupRef.current = true;
            if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);
            if (heartbeatTimerRef.current) window.clearInterval(heartbeatTimerRef.current);
            if (qualityTimerRef.current) window.clearInterval(qualityTimerRef.current);
            clearRecoveryTimer();
            socketRef.current?.close(1000, "participant left");
            socketRef.current = null;
            closePeer();
            stopMedia();
            if (remoteVideoElement) remoteVideoElement.srcObject = null;
        };
    }, [searchParams, user]);

    useEffect(() => {
        const updateFullscreen = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
        document.addEventListener("fullscreenchange", updateFullscreen);
        return () => document.removeEventListener("fullscreenchange", updateFullscreen);
    }, []);

    const checkDevices = async () => {
        setPreflightBusy(true);
        setError("");
        setNotice("");
        try {
            stopMedia();
            const stream = await requestMedia({ video: true });
            streamRef.current = stream;
            if (localVideo.current) localVideo.current.srcObject = stream;
            setPreflightReady(true);
            setStatus(audioOnlyRef.current ? "Microphone ready · audio-only" : "Camera and microphone ready");
        } catch (deviceError) {
            setError(deviceError.message || "Could not check your camera and microphone.");
            setStatus("Device check needs attention");
        } finally {
            setPreflightBusy(false);
        }
    };

    const joinConsultation = async () => {
        if (!consultationRef.current || preflightBusy) return;
        setError("");
        setPreflightBusy(true);
        try {
            if (!streamRef.current) {
                const stream = await requestMedia({ video: cameraEnabledRef.current && !audioOnlyRef.current });
                streamRef.current = stream;
                if (localVideo.current) localVideo.current.srcObject = stream;
            }
            if (user?.role === "doctor" && consultationRef.current.started_at == null) {
                const started = await API.startConsultation(consultationRef.current.id);
                consultationRef.current = started.data;
                setConsultation(started.data);
            }
            startedAtRef.current = consultationRef.current.started_at ? new Date(consultationRef.current.started_at).getTime() : Date.now();
            await startSessionRef.current?.();
            setCallStarted(true);
            if (!durationTimerRef.current) durationTimerRef.current = window.setInterval(() => setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000)), 1000);
        } catch (joinError) {
            setError(joinError.response?.data?.error || joinError.message || "Could not join this consultation.");
            setStatus("Unable to join consultation");
            setRetryAvailable(true);
        } finally {
            setPreflightBusy(false);
        }
    };

    const toggleFullscreen = async () => {
        if (!stageRef.current) return;
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await stageRef.current.requestFullscreen();
        } catch (fullscreenError) {
            setNotice("Fullscreen is not available in this browser window.");
        }
    };

    const toggleCamera = async () => {
        const nextEnabled = !cameraEnabledRef.current;
        cameraEnabledRef.current = nextEnabled;
        setCameraEnabled(nextEnabled);
        if (nextEnabled && audioOnlyRef.current) {
            await setAudioOnlyMode(false, "Camera enabled");
        } else {
            streamRef.current?.getVideoTracks().forEach((track) => { track.enabled = nextEnabled; });
            sendSignal({ type: "media_state", camera: nextEnabled && !audioOnlyRef.current, microphone: microphoneEnabledRef.current });
        }
    };

    const toggleMicrophone = () => {
        const nextEnabled = !microphoneEnabledRef.current;
        microphoneEnabledRef.current = nextEnabled;
        setMicrophoneEnabled(nextEnabled);
        streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = nextEnabled; });
        sendSignal({ type: "media_state", camera: cameraEnabledRef.current && !audioOnlyRef.current, microphone: nextEnabled });
    };

    const toggleAudioOnly = () => setAudioOnlyMode(!audioOnlyRef.current, !audioOnlyRef.current ? "Audio-only mode enabled" : "Video mode enabled");

    const retry = async () => {
        retryCountRef.current = 0;
        reconnectingRef.current = false;
        explicitlyEndedRef.current = false;
        setRetryAvailable(false);
        try {
            socketRef.current?.close(4000, "manual retry");
            socketRef.current = null;
            socketAuthorizedRef.current = false;
            closePeer();
            await startSession({ reconnect: true });
        } catch (retryError) {
            setError(retryError.response?.data?.error || retryError.message || "Retry failed.");
            setRetryAvailable(true);
        }
    };

    const sendChat = async (event) => {
        event.preventDefault();
        const text = chatMessage.trim();
        if (!text || !consultation || socketRef.current?.readyState !== WebSocket.OPEN || !socketAuthorizedRef.current || pendingChatRef.current) return;
        pendingChatRef.current = text;
        sendSignal({ type: "chat", text });
    };

    const endCall = async () => {
        if (explicitlyEndedRef.current) return;
        explicitlyEndedRef.current = true;
        setStatus("Leaving consultation");
        if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);
        try {
            sendSignal({ type: "call_ended" });
            if (consultation) await API.endConsultation(consultation.id, notes ? { notes } : {});
        } catch (endError) {
            setError(endError.response?.data?.error || "Could not save the consultation exit. The appointment remains unchanged.");
        } finally {
            if (qualityTimerRef.current) window.clearInterval(qualityTimerRef.current);
            if (heartbeatTimerRef.current) window.clearInterval(heartbeatTimerRef.current);
            clearRecoveryTimer();
            socketRef.current?.close(1000, "participant ended call");
            closePeer();
            stopMedia();
            setConnectionState("closed");
            setStatus("You left the consultation");
        }
    };

    const clock = formatClock(seconds);
    const appointment = consultation?.appointment;
    const otherParticipant = user?.role === "doctor" ? appointment?.patient?.user : appointment?.doctor?.user;
    const otherName = otherParticipant
        ? `${user?.role === "doctor" ? "" : "Dr. "}${otherParticipant.first_name || ""} ${otherParticipant.last_name || otherParticipant.username || ""}`.trim()
        : user?.role === "doctor" ? "Patient" : "Your clinician";

    return (
        <main className="video-consult-page">
            <CarelinePageHeader />
            <div className="video-consult-content">
                <header className="video-consult-header">
                    <div className="booth-heading"><p className="eyebrow">CARELINE / PRIVATE CONSULTATION</p><h1>Video consultation</h1><p className="booth-participant">{otherName}{appointment?.reason ? ` · ${appointment.reason}` : ""}</p></div>
                    <div className="booth-header-actions"><div className={`booth-connection connection-${connectionState}`}><span />{status} · {clock}<small>{quality}</small></div>{callStarted ? <button className="end-call" onClick={endCall} disabled={explicitlyEndedRef.current}>End call</button> : <Link className="booth-back" to="/appointments">Appointments</Link>}</div>
                </header>
                {error && <p className="consult-error" role="alert">{error}</p>}
                {notice && <p className="consult-notice" role="status">{notice}</p>}
                <div className={`booth-layout ${panelOpen ? "with-panel" : "panel-hidden"}`}>
                    <section className="booth-main-column">
                        <section className="video-stage" ref={stageRef} aria-label="Consultation video">
                            <video ref={remoteVideo} autoPlay playsInline className="remote-video" />
                            <video ref={localVideo} autoPlay muted playsInline className={`local-video ${callStarted ? "" : "precall-preview"}`} />
                            {!remoteMediaReady && <div className="video-waiting"><span className="waiting-pulse" /><strong>{callStarted ? status : "Your consultation room is ready"}</strong><small>{callStarted ? `Waiting for ${otherName} to join.` : `You are meeting with ${otherName}. Check your camera and microphone before joining.`}</small></div>}
                            {remoteMediaState && <span className="remote-media-state">{remoteMediaState.microphone ? "Mic on" : "Mic muted"} · {remoteMediaState.camera ? "Camera on" : "Camera off"}</span>}
                            <button className="fullscreen-control" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>{isFullscreen ? "⤢" : "⛶"}</button>
                            {!callStarted && <div className="precall-panel"><div><span className="precall-index">BEFORE YOU JOIN</span><h2>Check your setup</h2><p>{preflightReady ? (audioOnly ? "Microphone ready · audio-only" : "Camera and microphone ready") : "Preview your camera and confirm microphone access before entering."}</p></div><div className="precall-actions"><button className="device-check-button" onClick={checkDevices} disabled={preflightBusy || !consultation}>{preflightBusy ? "Checking devices…" : preflightReady ? "Check devices again" : "Check camera & mic"}</button><button className="join-consultation-button" onClick={joinConsultation} disabled={preflightBusy || !consultation}>{preflightBusy ? "Joining…" : "Join consultation"}<span aria-hidden="true">↗</span></button></div></div>}
                        </section>
                        <div className="booth-controls-row"><nav className="call-controls" aria-label="Call controls"><button onClick={toggleMicrophone} aria-pressed={!microphoneEnabled} disabled={!callStarted || explicitlyEndedRef.current}>{microphoneEnabled ? "Mute mic" : "Unmute mic"}</button><button onClick={toggleCamera} aria-pressed={!cameraEnabled} disabled={!callStarted || explicitlyEndedRef.current || audioOnly}>{cameraEnabled ? "Turn camera off" : "Turn camera on"}</button><button onClick={toggleAudioOnly} aria-pressed={audioOnly} disabled={!callStarted || explicitlyEndedRef.current}>{audioOnly ? "Enable video" : "Audio only"}</button>{retryAvailable && <button onClick={retry}>Retry connection</button>}</nav><button className="panel-toggle" onClick={() => setPanelOpen((open) => !open)} aria-expanded={panelOpen}>{panelOpen ? "Hide details & chat" : "Show details & chat"}</button></div>
                    </section>
                    {panelOpen && <aside className="booth-side-panel"><section className="appointment-context"><p className="panel-kicker">APPOINTMENT</p><h2>{otherName}</h2><p>{appointment?.reason || "Telehealth consultation"}</p><dl><div><dt>Date & time</dt><dd>{appointment?.start_at ? new Date(appointment.start_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Scheduled consultation"}</dd></div><div><dt>Status</dt><dd>{appointment?.status?.replaceAll("_", " ") || "Confirmed"}</dd></div></dl></section><section className="booth-chat-panel"><div className="panel-heading"><p className="panel-kicker">PRIVATE CHAT</p><span>{messages.length}</span></div><div className="chat-log" aria-live="polite">{messages.length ? messages.map((item, index) => <p className={item.own ? "own" : ""} key={`${item.timestamp}-${index}`}><strong>{item.sender}</strong>{item.text}<time>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</time></p>) : <p className="chat-empty">Messages for this consultation will appear here.</p>}</div><form className="chat-entry" onSubmit={sendChat}><input value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} placeholder="Write a message" disabled={!callStarted || explicitlyEndedRef.current} /><button type="submit" disabled={!chatMessage.trim() || !callStarted || explicitlyEndedRef.current}>Send</button></form></section><section className="booth-notes-panel"><label htmlFor="consultation-notes">Consultation notes</label><textarea id="consultation-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes for this consultation" disabled={explicitlyEndedRef.current} /></section></aside>}
                </div>
            </div>
        </main>
    );
}

export default VideoConsult;
