

import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
// import AppointmentList from "../components/AppointmentList";
import Home from "../pages/Home";
import Telemedicine from "../pages/Telemedicine";
import VideoConsult from "../pages/VideoConsult";
import ChatConsult from "../pages/ChatConsult1";
import "../App.css"; // Ensure CSS is linked for styling
import myImage from "./health-report.png";

import React, { useEffect, useState } from "react";
import "../styles/Appointment.css";

import { getAppointments } from "../services/api"; // Import API function
 
// import './styles/dark-mode.css';
// import './styles/header.css';
// import './styles/navigation.css';
// import './styles/buttons.css';
// import './styles/dropdown.css';
// import './styles/footer.css';
// import './styles/layout.css';



const AppointmentList = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false); // Dark mode state

    const navigate = useNavigate();

    const goToAbout = () => {
      navigate("/telemedicine");
    };

    // Toggle dark mode
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        getAppointments()
            .then(response => setAppointments(response.data))
            .catch(error => console.error("Error fetching appointments:", error));
    }, []);


    return (
        <div className={darkMode ? "app-container dark" : "app-container"}>
                {/* Header */}
                <header className="app-header sticky-header">
                    <div className="logo">
                        <Link to="/">🏥 HealthCare</Link>
                    </div>
                    {/* Mobile Hamburger Menu */}
                    <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}><h3>ham</h3>
                    </div>
                    <nav className={menuOpen ? "nav open" : "nav"}>
                        <ul>
                            <li><Link to="/home">Home</Link></li>
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
                                        <li><Link to="/video-consult" style={{color:"black",fontSize:"15px", margin:"0px -10px"}}>📹 Video Consult</Link></li>
                                    </ul>
                                )}
                            </li>
                            <li><Link to="/chat-consult" > Chat Consult</Link></li>

                        </ul>
                    </nav>
                    {/* Dark Mode Toggle */}
                    <button className="dark-mode-toggle" onClick={toggleDarkMode}>
                        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                    </button>
                </header>

                {/* {body} */}
                <div className="appoint-main">
                    <h1><center>Appointments</center></h1>
                    <div class="sect">
                    <div class="appt auth" onClick={(goToAbout)}>
                        <h4>Authentic Form</h4>
                        <div className={`box one`}></div>
                        <p>Complete the Authentication form to manage your health information and view your Medical data anytime</p>
                    </ div>
                    <div class="appt off">
                        <h4>Offline Appointment</h4>
                        <div className={`box two`}></div>
                        <p>Plan ahead and book your appointments. Secure your spot with just one click!
                            Book your appointment now!</p>
                    </ div>
                    <div class="appt on" onClick={(goToAbout)}>
                        <h4>Online Appointment</h4>
                        <div className={`box three`}></div>
                        <p>Schedule your online appointment today.
Connect with ease from anywhere.
 Book now for a seamless experience."</p>
                    </div>
                    </div>
                    
                </div>
                {/* Main Content Area */}
                <div className="main-content">
                    <Routes>
                        {/* <Route path="/" element={
                                <div className="appoint-main">
                                    <h2><center>Appointments</center></h2>
                                    <ul>
                                        <li><link to="/telemedicine"></link></li>
                                        <li><link to="/video-consult"></link></li>
                                        <li><link to="/telemedicine"></link></li>
                                    </ul>
                    
                                </div>
                        }/> */}
                        <Route path="/home" element={<Home />} />
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
    );
    
};

export default AppointmentList;
