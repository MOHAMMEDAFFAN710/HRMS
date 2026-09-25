import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';
const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
});

function ChatConsult() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleIncomingMessage = (payload) => {
      const nextMessage = typeof payload === 'string'
        ? { text: payload, sender: 'doctor', id: `${Date.now()}-${Math.random()}` }
        : { ...payload, id: payload.id || `${Date.now()}-${Math.random()}` };

      setMessages((prev) => [...prev, nextMessage]);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message', handleIncomingMessage);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message', handleIncomingMessage);
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const outgoingMessage = {
      text: trimmedMessage,
      sender: 'patient',
      id: `${Date.now()}-${Math.random()}`,
    };

    socket.emit('message', trimmedMessage);
    setMessages((prev) => [...prev, outgoingMessage]);
    setMessage('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f4ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          padding: '24px',
          border: '1px solid #dfeefb',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ margin: 0, color: '#e5a868' }}>Chat with Doctor</h2>
          <span
            style={{
              background: isConnected ? '#d9fbe5' : '#fef3c7',
              color: isConnected ? '#166534' : '#92400e',
              borderRadius: '999px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {isConnected ? 'Online' : 'Connecting...'}
          </span>
        </div>

        <div
          style={{
            height: '320px',
            overflowY: 'auto',
            border: '1px solid #dfeaf5',
            borderRadius: '12px',
            padding: '14px',
            background: '#f8fbff',
            marginBottom: '14px',
          }}
        >
          {messages.length === 0 ? (
            <p style={{ margin: 0, color: '#6b7280', textAlign: 'center', paddingTop: '110px' }}>
              No messages yet. Start the conversation.
            </p>
          ) : (
            messages.map((msg) => {
              const text = typeof msg === 'string' ? msg : msg.text || '';
              const isPatient = typeof msg !== 'string' ? msg.sender === 'patient' : false;

              return (
                <div
                  key={msg.id || `${text}-${Math.random()}`}
                  style={{
                    display: 'flex',
                    justifyContent: isPatient ? 'flex-end' : 'flex-start',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: isPatient ? '#e5a868' : '#eaf3ff',
                      color: isPatient ? '#fff' : '#1f2937',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    {text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={!isConnected}
            style={{
              flex: 1,
              padding: '12px 14px',
              border: '1px solid #d0d9e8',
              borderRadius: '10px',
              outline: 'none',
              fontSize: '14px',
              background: isConnected ? '#fff' : '#f3f4f6',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !message.trim()}
            style={{
              background: !isConnected || !message.trim() ? '#d1d5db' : '#e5a868',
              color: '#fff',
              padding: '12px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: !isConnected || !message.trim() ? 'not-allowed' : 'pointer',
              fontWeight: '600',
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
