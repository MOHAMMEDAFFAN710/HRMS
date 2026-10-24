import React, { useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../services/api";
import CarelinePageHeader from "../components/CarelinePageHeader";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/video.css";

const WS_URL = process.env.REACT_APP_WS_URL || `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8000`;

function ChatConsult() {
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const [consultation, setConsultation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState("");
    const socketRef = useRef(null);
    const messageEndRef = useRef(null);
    const pendingMessageRef = useRef("");
    const heartbeatRef = useRef(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        let socket;
        let cancelled = false;
        mountedRef.current = true;
        const initialize = async () => {
            try {
                const id = searchParams.get("consultation");
                if (!id) throw new Error("Open chat from an authorized consultation.");
                const [consultationResponse, messagesResponse] = await Promise.all([
                    API.getConsultations(),
                    API.getMessages(id),
                ]);
                const selected = consultationResponse.data.find((item) => String(item.id) === id);
                if (!selected || selected.ended_at) throw new Error("This consultation is unavailable or has ended.");
                if (cancelled) return;
                setConsultation(selected);
                setMessages(messagesResponse.data.map((item) => ({
                    text: item.text,
                    own: item.sender?.id === user?.id,
                    sender: item.sender?.first_name || item.sender?.role || "participant",
                    timestamp: item.created_at,
                })));
                const { data } = await API.getConsultationSocketTicket(selected.id);
                if (cancelled) return;
                const socketUrl = WS_URL.replace(/^http/, "ws");
                socket = new WebSocket(`${socketUrl}/ws/consultations/${selected.room_id}/`);
                socketRef.current = socket;
                const timeout = window.setTimeout(() => {
                    if (socket.readyState !== WebSocket.OPEN) setError("The consultation chat could not connect in time.");
                }, 10000);
                socket.onopen = () => socket.send(JSON.stringify({ type: "authenticate", ticket: data.ticket }));
                socket.onmessage = (event) => {
                    let payload;
                    try { payload = JSON.parse(event.data); } catch (parseError) { setError("Received an invalid chat response."); return; }
                    if (payload.type === "authenticated") {
                        window.clearTimeout(timeout);
                        setConnected(true);
                        heartbeatRef.current = window.setInterval(() => {
                            if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "heartbeat" }));
                        }, 25000);
                    } else if (payload.type === "chat_sent") {
                        const ownText = pendingMessageRef.current;
                        if (ownText) {
                            setMessages((current) => [...current, { text: ownText, own: true, sender: "you", timestamp: payload.timestamp }]);
                            pendingMessageRef.current = "";
                            setMessage("");
                        }
                    } else if (payload.type === "chat") {
                        if (payload.participant_id !== user?.id) {
                            setMessages((current) => [...current, { text: payload.text, sender: payload.role || "participant", timestamp: payload.timestamp || new Date().toISOString() }]);
                        }
                    } else if (payload.type === "error") {
                        pendingMessageRef.current = "";
                        setError(payload.message || "The chat server rejected the message.");
                    }
                };
                socket.onerror = () => setError("Chat connection failed. Refresh this page to reconnect.");
                socket.onclose = (event) => {
                    window.clearTimeout(timeout);
                    if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
                    setConnected(false);
                    if (event.code === 4401 || event.code === 4403) setError("You are not authorized to access this consultation chat.");
                };
            } catch (requestError) {
                if (!cancelled && mountedRef.current) setError(requestError.response?.data?.error || requestError.message || "Chat is temporarily unavailable.");
            }
        };
        initialize();
        return () => {
            cancelled = true;
            mountedRef.current = false;
            if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
            socket?.close(1000, "chat page left");
            socketRef.current = null;
        };
    }, [searchParams, user]);

    useEffect(() => messageEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

    const sendMessage = async (event) => {
        event.preventDefault();
        const text = message.trim();
        if (!text || !connected || !consultation || pendingMessageRef.current) return;
        try {
            pendingMessageRef.current = text;
            socketRef.current?.send(JSON.stringify({ type: "chat", text }));
        } catch (sendError) {
            pendingMessageRef.current = "";
            setError(sendError.response?.data?.error || "Message could not be sent. Your draft has been kept.");
        }
    };

    return (
        <main className="video-consult-page chat-consult-page">
            <CarelinePageHeader />
            <div className="video-consult-content">
                <header className="video-consult-header"><div><p className="eyebrow">Consultation chat</p><h1>Talk with your care team</h1><p className={connected ? "connected" : "disconnected"}>{connected ? "Securely connected" : error || "Connecting to consultation"}</p></div></header>
                {error && <p className="consult-error" role="alert">{error}</p>}
                <section className="chat-log" aria-live="polite">{messages.map((item, index) => <p className={item.own ? "own" : ""} key={`${item.timestamp}-${index}`}><strong>{item.sender}</strong> {item.text}<time>{item.timestamp ? new Date(item.timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : ""}</time></p>)}<div ref={messageEndRef} /></section>
                <form className="chat-entry" onSubmit={sendMessage}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message" disabled={!connected || Boolean(consultation?.ended_at)} /><button type="submit" disabled={!connected || !message.trim() || Boolean(consultation?.ended_at)}>Send</button></form>
            </div>
        </main>
    );
}

export default ChatConsult;
