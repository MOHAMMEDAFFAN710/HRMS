import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import AppointmentList from './components/AppointmentList';
import Telemedicine from './pages/Telemedicine';
import VideoConsult from './pages/VideoConsult';
import ChatConsult from './pages/ChatConsult';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

// Create Auth Context
const AuthContext = React.createContext();

// Configure Axios
const API = axios.create({
baseURL: 'http://localhost:8000/api/',
timeout: 10000,
});

// Request interceptor for auth tokens
API.interceptors.request.use((config) => {
const token = localStorage.getItem('token');
if (token) {
    config.headers.Authorization = `Token ${token}`;
}
return config;
});

// API Service
export const apiService = {
  // Auth
register: (data) => API.post('register/', data),
login: (data) => API.post('login/', data),
logout: () => API.post('logout/'),
getCurrentUser: () => API.get('current-user/'),
testConnection: () => API.get('test/'),

  // Models
  getDoctors: () => API.get('doctors/'),
  createAppointment: (data) => API.post('appointments/', data),
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (localStorage.getItem('token')) {
        try {
          const { data } = await apiService.getCurrentUser();
          setUser(data);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (credentials) => {
    const response = await apiService.login(credentials);
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response;
  };

  const logout = async () => {
    await apiService.logout();
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

// Main App Component
const App = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [backendStatus, setBackendStatus] = useState('Checking connection...');
  const [connectionTested, setConnectionTested] = useState(false);
  const { user, logout } = useContext(AuthContext);

  // Test backend connection on component mount
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        const response = await apiService.testConnection();
        setBackendStatus(`Backend: ${response.data.status}`);
      } catch (error) {
        setBackendStatus('Backend: Connection failed!');
        console.error('Backend connection error:', error);
      } finally {
        setConnectionTested(true);
      }
    };

    testBackendConnection();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={darkMode ? "app-container dark" : "app-container"}>
      {/* Header */}
      <header className="app-header sticky-header">
        <div className="logo">
          <Link to="/">🏥 HealthCare</Link>
        </div>
        
        {/* Connection status badge */}
        {connectionTested && (
          <div className={`connection-badge ${backendStatus.includes('failed') ? 'error' : 'success'}`}>
            {backendStatus}
          </div>
        )}

        {/* Mobile Hamburger Menu */}
        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          &#9776;
        </div>

        <nav className={menuOpen ? "nav open" : "nav"}>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/appointments">Appointments</Link></li>

            {/* Telemedicine Dropdown */}
            <li
              className="dropdown"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <Link to="/telemedicine" className="dropdown-toggle">
                Telemedicine ⏷
              </Link>
              {dropdownOpen && (
                <ul className="dropdown-menu">
                  <li><Link to="/video-consult">📹 Video Consult</Link></li>
                  <li><Link to="/chat-consult">💬 Chat Consult</Link></li>
                </ul>
              )}
            </li>

            {/* Auth Links */}
            {user ? (
              <li>
                <button onClick={logout} className="logout-button">
                  Logout
                </button>
              </li>
            ) : (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </>
            )}
          </ul>
        </nav>

        {/* Dark Mode Toggle */}
        <button className="dark-mode-toggle" onClick={toggleDarkMode}>
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
    </header>

      {/* Main Content Area */}
    <div className="main-content">
        <Routes>
        <Route path="/" element={
            <div className="centered-content">
        <h1>Welcome To The Healthcare App</h1>
            <div className="connection-message">
                {!connectionTested ? (
            <p>Testing backend connection...</p>
                ) : (
                <p className={backendStatus.includes('failed') ? 'error' : 'success'}>
                    {backendStatus}
                </p>
                )}
            </div>
            {user && (
                <div className="user-welcome">
        Welcome, {user.username}!
                </div>
            )}
            </div>
        } />
        <Route path="/appointments" element={
            <ProtectedRoute>
            <AppointmentList />
            </ProtectedRoute>
        } />
        <Route path="/telemedicine" element={
            <ProtectedRoute>
        <Telemedicine />
            </ProtectedRoute>
} />
        <Route path="/video-consult" element={
            <ProtectedRoute>
    <VideoConsult />
            </ProtectedRoute>
        } />
        <Route path="/chat-consult" element={
            <ProtectedRoute>
            <ChatConsult />
            </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        </Routes>
    </div>

      {/* Footer */}
    <footer>
        <p>© 2025 Healthcare Web App | All Rights Reserved</p>
        {connectionTested && (
        <p className="footer-status">
            Backend Status: {backendStatus}
        </p>
        )}
    </footer>
    </div>
);
};

// Root Application Component
const RootApp = () => (
<Router>
    <AuthProvider>
    <App />
    </AuthProvider>
</Router>
);

export default RootApp;