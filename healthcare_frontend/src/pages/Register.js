import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthExperience from "../components/AuthExperience";

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = (e) => {
        e.preventDefault();
        alert("Registration Successful!");
    };

    return (
        <AuthExperience mode="register">
            <h2>Create your care space</h2>
            <p className="auth-intro">A private beginning for clearer, more connected healthcare.</p>
            <form className="auth-form" onSubmit={handleRegister}>
                <div className="auth-field"><label htmlFor="register-name">Your name</label><input id="register-name" type="text" placeholder="How should we call you?" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                <div className="auth-field"><label htmlFor="register-email">Email address</label><input id="register-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="auth-field"><label htmlFor="register-password">Create a password</label><input id="register-password" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <button className="auth-submit" type="submit">Begin with care <span>↗</span></button>
            </form>
            <p className="auth-switch">Already have a space? <Link to="/login">Sign in</Link></p>
        </AuthExperience>
    );
};

export default Register;
