import React, { useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import "../styles/video.css";

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
    <div className="video-centered" >
    <h2>Telemedicine Video Call</h2>
    <video ref={videoRef} autoPlay playsInline style={{ width: "250x",height:"300px", border: "1px solid black", background:"white"}} />
    <form>
        <input className='custom-num' type='tel' placeholder="Enter PhoneNumber" ></input>
    </form>
        <button className="num-submit" onClick={startVideo}>Start Video Call</button>
    </div>
);
}

export default VideoConsult;
