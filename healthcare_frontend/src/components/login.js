import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/login.css"

function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === '' || password === '') {
      setError('All fields are required');
      return;
    } 

    // Dummy login check (you can add actual authentication here)
    if (username === 'admin' && password === '123') {
      setIsLoggedIn(true);
      navigate('/');
      
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    // <div className="main-background">

        <div className="login-box">
        
            <h2>Login Page</h2>
            <form onSubmit={handleLogin}>
            <div>
                <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <br />
            <div>
                <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <br />
            <button type="submit">Login</button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>           
        // </div>
    );
}

export default Login;
