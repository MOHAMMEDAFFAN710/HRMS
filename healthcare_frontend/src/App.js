import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import AppointmentList from './components/AppointmentList';
import Telemedicine from './pages/Telemedicine';
import VideoConsult from './pages/VideoConsult';
import ChatConsult from './pages/ChatConsult';
import Login from './pages/Login';
import Register from './pages/Register';
import ExperienceLanding from './components/ExperienceLanding';
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
  return (
    <div className="app-container">
      <div className="main-content">
        <Routes>
        <Route path="/" element={<ExperienceLanding />} />
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