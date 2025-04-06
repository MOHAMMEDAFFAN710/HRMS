import React from 'react';
import { useNavigate } from 'react-router-dom';

function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Welcome to My Application</h2>
      <p>Choose an option to continue:</p>

      <button 
        onClick={() => navigate('/login')}
        style={{ margin: '10px', padding: '10px 20px' }}
      >
        Login
      </button>

      <button 
        onClick={() => navigate('/home')}
        style={{ margin: '10px', padding: '10px 20px' }}
      >
        Continue as Guest
      </button>
    </div>
  );
}

export default Welcome;
