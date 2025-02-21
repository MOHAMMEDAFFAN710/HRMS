import React, { useState } from "react";
import "../styles/AuthForm.css"; // Link to styles

const AuthForm = ({ type }) => {
    const [formData, setFormData] = useState({ email: "", password: "" });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`${type} Successful!`);
    };

    return (
        <div className="auth-container">
            <h2>{type === "login" ? "Login" : "Register"}</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <button type="submit">{type === "login" ? "Login" : "Sign Up"}</button>
            </form>
        </div>
    );
};

export default AuthForm;
