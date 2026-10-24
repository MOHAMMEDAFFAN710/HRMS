import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthExperience from "../components/AuthExperience";
import API from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/AuthRegistration.css";

const Register = () => {
    const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", confirm_password: "", phone: "", date_of_birth: "", medical_history: "", allergies: "", emergency_contact: "", specialization: "", languages: "", experience_years: "" });
    const [role, setRole] = useState("patient");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        if (form.password !== form.confirm_password) {
            setError("The passwords do not match.");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                username: form.email.trim().toLowerCase(),
                email: form.email.trim().toLowerCase(),
                role,
                experience_years: Number(form.experience_years || 0),
                languages: form.languages.split(",").map((language) => language.trim()).filter(Boolean),
            };
            await API.register(payload);
            await login({ username: payload.email, password: form.password, role });
            navigate("/profile");
        } catch (requestError) { setError(requestError.response?.data?.error || "We could not create your account. Please check your details and try again."); }
        finally { setSubmitting(false); }
    };

    const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

    return (
        <AuthExperience mode="register">
            <h2>Create your account</h2>
            <p className="auth-intro">Your details are saved to your private {role} profile and can be updated later.</p>
            {error && <p role="alert" className="auth-error">{error}</p>}
            <form className="auth-form" onSubmit={handleRegister}>
                <div className="auth-field"><label htmlFor="register-role">Account type</label><select id="register-role" value={role} onChange={(event) => setRole(event.target.value)}><option value="patient">Patient</option><option value="doctor">Doctor / clinician</option></select></div>
                <div className="auth-field-row">
                    <div className="auth-field"><label htmlFor="register-first-name">First name</label><input id="register-first-name" name="first_name" autoComplete="given-name" value={form.first_name} onChange={updateField} required /></div>
                    <div className="auth-field"><label htmlFor="register-last-name">Last name</label><input id="register-last-name" name="last_name" autoComplete="family-name" value={form.last_name} onChange={updateField} required /></div>
                </div>
                <div className="auth-field"><label htmlFor="register-email">Email address</label><input id="register-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={updateField} required /></div>
                <div className="auth-field"><label htmlFor="register-phone">Phone number</label><input id="register-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={updateField} /></div>
                {role === "patient" ? <>
                    <div className="auth-field"><label htmlFor="register-dob">Date of birth</label><input id="register-dob" name="date_of_birth" type="date" autoComplete="bday" value={form.date_of_birth} onChange={updateField} /></div>
                    <div className="auth-field"><label htmlFor="register-history">Medical history</label><textarea id="register-history" name="medical_history" rows="2" placeholder="Conditions or relevant history (optional)" value={form.medical_history} onChange={updateField} /></div>
                    <div className="auth-field"><label htmlFor="register-allergies">Allergies</label><textarea id="register-allergies" name="allergies" rows="2" placeholder="List allergies, or leave blank" value={form.allergies} onChange={updateField} /></div>
                    <div className="auth-field"><label htmlFor="register-emergency">Emergency contact</label><input id="register-emergency" name="emergency_contact" placeholder="Name and phone number (optional)" value={form.emergency_contact} onChange={updateField} /></div>
                </> : <>
                    <div className="auth-field"><label htmlFor="register-specialization">Medical specialty</label><input id="register-specialization" name="specialization" placeholder="e.g. Family medicine" value={form.specialization} onChange={updateField} required /></div>
                    <div className="auth-field"><label htmlFor="register-languages">Languages</label><input id="register-languages" name="languages" placeholder="English, Hindi" value={form.languages} onChange={updateField} /></div>
                    <div className="auth-field"><label htmlFor="register-experience">Years of experience</label><input id="register-experience" name="experience_years" type="number" min="0" max="80" value={form.experience_years} onChange={updateField} /></div>
                </>}
                <div className="auth-field"><label htmlFor="register-password">Password</label><input id="register-password" name="password" type="password" autoComplete="new-password" minLength="8" placeholder="At least 8 characters" value={form.password} onChange={updateField} required /></div>
                <div className="auth-field"><label htmlFor="register-confirm-password">Confirm password</label><input id="register-confirm-password" name="confirm_password" type="password" autoComplete="new-password" minLength="8" value={form.confirm_password} onChange={updateField} required /></div>
                <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? "Creating account..." : `Create ${role} account`} <span>↗</span></button>
            </form>
            <p className="auth-switch">Already have an account? <Link to={role === "doctor" ? "/doctor-login" : "/login"}>{role === "doctor" ? "Doctor sign in" : "Patient sign in"}</Link></p>
        </AuthExperience>
    );
};

export default Register;
