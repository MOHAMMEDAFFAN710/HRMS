import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import AccountActions from "./AccountActions";
import "./CarelinePageHeader.css";

const CarelinePageHeader = () => {
    const { user } = useContext(AuthContext);

    return (
        <header className="careline-page-header">
            <Link to="/" className="careline-page-brand"><span aria-hidden="true">◌</span> careline</Link>
            <nav aria-label="Main navigation">
                <Link to="/telemedicine">Care</Link>
                <Link to="/health-awareness">Health Awareness</Link>
                <Link to="/appointments">Appointments</Link>
                <Link to="/profile">Profile</Link>
                {user?.role === "doctor" && <Link to="/dataset">Dataset</Link>}
            </nav>
            <AccountActions />
        </header>
    );
};

export default CarelinePageHeader;