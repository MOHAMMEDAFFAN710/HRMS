

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import AppointmentList from "./components/AppointmentList";
import Login from './components/login';
import Telemedicine from "./pages/Telemedicine";
import VideoConsult from "./pages/VideoConsult";
import ChatConsult from "./pages/ChatConsult";
// import SplashScreen from "./pages/SplashScreen";
import Home from "./pages/Home";
import "./App.css"; // Ensure CSS is linked for styling
import Welcome from "./components/welcome";



const App = () => {
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    // Toggle dark mode


    return (
        <Router>
                {/* Main Content Area */}
                <div className="main-content">
                    <Routes>
                        <Route 
                            path="/" 
                            element={
                        isLoggedIn ? <Home /> : <Navigate to="/login" />
                        } />
                        <Route 
                            path="/login" 
                            element={<Login setIsLoggedIn={setIsLoggedIn} />} 
                        />
                        <Route path="/home" element={<Home />} />
                        <Route path="/appointments" element={<AppointmentList />} />
                        <Route path="/telemedicine" element={<Telemedicine />} />
                        <Route path="/video-consult" element={<VideoConsult />} />
                        <Route path="/chat-consult" element={<ChatConsult />} />
                    </Routes>
                </div>

        </Router>
    );
    
};

export default App;
