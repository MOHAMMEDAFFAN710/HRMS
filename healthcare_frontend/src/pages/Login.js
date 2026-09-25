import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthExperience from "../components/AuthExperience";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (email === "admin@example.com" && password === "123") {
            alert("Login Successful!");
            navigate("/");
        } else {
            alert("Invalid credentials!");
        }
    };

    return (
        <AuthExperience mode="login">
            <h2>Enter your care space</h2>
            <p className="auth-intro">Pick up where you left off, with everything important kept close.</p>
            <form className="auth-form" onSubmit={handleLogin}>
                <div className="auth-field"><label htmlFor="login-email">Email address</label><input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="auth-field"><label htmlFor="login-password">Password</label><input id="login-password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <button className="auth-submit" type="submit">Continue securely <span>↗</span></button>
            </form>
            <p className="auth-switch">New to careline? <Link to="/register">Create your space</Link></p>
        </AuthExperience>
    );
};

export default Login;
