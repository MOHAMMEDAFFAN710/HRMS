import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css"; // Import CSS for styling

const Navbar = ({ toggleDarkMode, darkMode }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <header className="navbar">
            <div className="logo">
                <Link to="/">🏥 HealthCare</Link>
            </div>

            {/* Hamburger Menu for Mobile */}
            <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                &#9776;
            </div>

            <nav className={menuOpen ? "nav open" : "nav"}>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/appointments">Appointments</Link></li>
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
                {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
            </button>
        </header>
    );
};

export default Navbar;
