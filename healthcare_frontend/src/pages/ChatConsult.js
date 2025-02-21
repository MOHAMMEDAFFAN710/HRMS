import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8000');

function ChatConsult() {
const [message, setMessage] = useState('');
const [messages, setMessages] = useState([]);

useEffect(() => {
    socket.on('message', (msg) => {
    setMessages((prev) => [...prev, msg]);
    });
}, []);

const sendMessage = () => {
    socket.emit('message', message);
    setMessage('');
};

return (
    <div>
    <h2>Chat with Doctor</h2>
    <div>
        {messages.map((msg, index) => (
        <p key={index}>{msg}</p>
        ))}
    </div>
    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
    <button onClick={sendMessage}>Send</button>
    </div>
);
}

export default ChatConsult;
