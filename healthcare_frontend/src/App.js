import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppointmentList from './components/AppointmentList';
import Telemedicine from './pages/Telemedicine';
import VideoConsult from './pages/VideoConsult';
import ChatConsult from './pages/ChatConsult';
import Login from './pages/Login';
import Register from './pages/Register';
import ExperienceLanding from './components/ExperienceLanding';
import Profile from './pages/Profile';
import Dataset from './pages/Dataset';
import HealthAwareness from './pages/HealthAwareness';
import CarelinePageHeader from './components/CarelinePageHeader';
import GlobalPhotoBackdrop from './components/GlobalPhotoBackdrop';
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './App.css';

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
      <GlobalPhotoBackdrop />
      <div className="main-content">
        <Routes>
        <Route path="/" element={<ExperienceLanding />} />
        <Route path="/health-awareness" element={<HealthAwareness />} />
        <Route path="/appointments" element={
            <ProtectedRoute>
            <CarelinePageHeader />
            <AppointmentList />
            </ProtectedRoute>
        } />
        <Route path="/profile" element={<ProtectedRoute><><CarelinePageHeader /><Profile /></></ProtectedRoute>} />
        <Route path="/dataset" element={<ProtectedRoute><DoctorOnlyRoute><><CarelinePageHeader /><Dataset /></></DoctorOnlyRoute></ProtectedRoute>} />
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
        <Route path="/login" element={<Login role="patient" />} />
        <Route path="/doctor-login" element={<Login role="doctor" />} />
        <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
);
};

const DoctorOnlyRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (user?.role !== 'doctor') return <Navigate to="/appointments" replace />;
  return children;
};

// Root Application Component
const RootApp = () => (
<Router>
  <LanguageProvider>
    <AuthProvider>
    <App />
    </AuthProvider>
  </LanguageProvider>
</Router>
);

export default RootApp;