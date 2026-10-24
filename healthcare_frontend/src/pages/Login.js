import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthExperience from "../components/AuthExperience";
import { AuthContext } from "../contexts/AuthContext";

const Login = ({ role = "patient" }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try { await login({ username: email, password, role }); navigate(role === "doctor" ? "/appointments" : "/"); }
        catch (requestError) { setError(requestError.response?.data?.error || "We could not sign you in."); }
    };

    return (
        <AuthExperience mode="login">
            <h2>{role === "doctor" ? "Clinician sign in" : "Patient sign in"}</h2>
            <p className="auth-intro">{role === "doctor" ? "Sign in to manage your schedule and patient consultations." : "Sign in to manage your profile, appointments, and care."}</p>
            {error && <p role="alert" className="auth-error">{error}</p>}
            <form className="auth-form" onSubmit={handleLogin}>
                <div className="auth-field"><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="username" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="auth-field"><label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <button className="auth-submit" type="submit">Sign in as {role} <span>↗</span></button>
            </form>
            {role === "patient" ? <p className="auth-switch">New to careline? <Link to="/register">Create a patient account</Link><br /><Link to="/doctor-login">Doctor sign in</Link></p> : <p className="auth-switch">Clinician new to careline? <Link to="/register">Create a doctor account</Link><br /><Link to="/login">Patient sign in</Link></p>}
        </AuthExperience>
    );
};

export default Login;
