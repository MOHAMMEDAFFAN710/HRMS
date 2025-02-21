import React, { useRef, useState } from 'react';
import SimplePeer from 'simple-peer';

function VideoConsult() {
const [stream, setStream] = useState(null);
const videoRef = useRef();

const startVideo = async () => {
    try {
    const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(userStream);
    if (videoRef.current) videoRef.current.srcObject = userStream;
    } catch (error) {
    console.error("Error accessing camera", error);
    }
};

return (
    <div>
    <h2>Telemedicine Video Call</h2>
    <video ref={videoRef} autoPlay playsInline style={{ width: "500px", border: "1px solid black" }} />
    <button onClick={startVideo}>Start Video Call</button>
    </div>
);
}

export default VideoConsult;
