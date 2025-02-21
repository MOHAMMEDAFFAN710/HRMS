

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AppointmentList from "./components/AppointmentList";
import Telemedicine from "./pages/Telemedicine";
import VideoConsult from "./pages/VideoConsult";
import ChatConsult from "./pages/ChatConsult";
import "./App.css"; // Ensure CSS is linked for styling

//import './styles/dark-mode.css';
//import './styles/header.css';
//import './styles/navigation.css';
//import './styles/buttons.css';
//import './styles/dropdown.css';
//import './styles/footer.css';
//import './styles/layout.css';



const App = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false); // Dark mode state

    // Toggle dark mode
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    return (
        <Router>
            <div className={darkMode ? "app-container dark" : "app-container"}>
                {/* Header */}
                <header className="app-header sticky-header">
                    <div className="logo">
                        <Link to="/">🏥 HealthCare</Link>
                    </div>
                    
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
                        <Route path="/" element={<div className="centered-content"><h1>Welcome To The Healthcare App</h1></div>} />
                        <Route path="/appointments" element={<AppointmentList />} />
                        <Route path="/telemedicine" element={<Telemedicine />} />
                        <Route path="/video-consult" element={<VideoConsult />} />
                        <Route path="/chat-consult" element={<ChatConsult />} />
                    </Routes>
                </div>

                {/* Footer */}
                <footer>
                    <p>© 2025 Healthcare Web App | All Rights Reserved</p>
                </footer>
            </div>
        </Router>
    );
};

export default App;
