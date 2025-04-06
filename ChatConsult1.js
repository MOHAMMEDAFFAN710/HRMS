import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import logo from './logo.jpg'; // Updated to .jpg

// Connect to the WebSocket server
const socket = io('http://localhost:8000');

function ChatConsult() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // Listen for incoming messages from the server
  useEffect(() => {
    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Clean up socket connection on component unmount
    return () => {
      socket.off('message');
    };
  }, []);

  // Send message to the server
  const sendMessage = () => {
    if (message.trim() !== '') {
      socket.emit('message', message);
      setMessage('');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f0f9ff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      {/* Logo Section */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <img
          src={logo}
          alt="AI Logo"
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%', // Circular shape
            border: '2px solid #e5a868', // Border color
            marginBottom: '10px',
          }}
        />
      </div>

      {/* Chat Box Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2 style={{ color: '#e5a868', marginBottom: '20px' }}>
          Chat with Doctor
        </h2>

        {/* Message Display Section */}
        <div
          style={{
            height: '300px',
            overflowY: 'auto',
            border: '1px solid #ccc',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '10px',
          }}
        >
          {messages.map((msg, index) => (
            <p key={index} style={{ margin: '5px 0', color: '#333' }}>
              {msg}
            </p>
          ))}
        </div>

        {/* Input Field and Send Button */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '8px',
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              backgroundColor: '#e5a868',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatConsult;
