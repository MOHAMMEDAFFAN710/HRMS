import React, { useContext, useEffect, useState } from "react";
import API from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/profile.css";

function Profile() {
    const { user } = useContext(AuthContext);
    const [form, setForm] = useState({ preferred_language: "", phone: "", medical_history: "", allergies: "", specialization: "", languages: "", experience_years: 0 });
    const [availability, setAvailability] = useState([]);
    const [slot, setSlot] = useState({ weekday: 0, start_time: "09:00", end_time: "17:00", slot_minutes: 30 });
    const [message, setMessage] = useState("");

    const load = async () => {
        const response = user.role === "doctor" ? await API.getDoctorProfile() : await API.getPatientProfile();
        setForm((current) => ({ ...current, ...response.data, phone: user.phone || "", preferred_language: user.preferred_language || "", languages: (response.data.languages || []).join(", ") }));
        if (user.role === "doctor") setAvailability((await API.getAvailability()).data);
    };
    useEffect(() => { load().catch(() => setMessage("Profile could not be loaded.")); }, [user]);

    const save = async (event) => {
        event.preventDefault();
        try {
            await API.updateCurrentUser({ phone: form.phone, preferred_language: form.preferred_language });
            if (user.role === "doctor") await API.updateDoctorProfile({ specialization: form.specialization, languages: form.languages.split(",").map((item) => item.trim()).filter(Boolean), experience_years: form.experience_years });
            else await API.updatePatientProfile({ medical_history: form.medical_history, allergies: form.allergies });
            setMessage("Your profile is up to date.");
        } catch (error) { setMessage(error.response?.data?.error || "Profile could not be saved."); }
    };
    const addAvailability = async (event) => { event.preventDefault(); try { const response = await API.createAvailability(slot); setAvailability((current) => [...current, response.data]); } catch (error) { setMessage(error.response?.data?.detail || "Availability could not be saved."); } };
    const removeAvailability = async (id) => { await API.deleteAvailability(id); setAvailability((current) => current.filter((item) => item.id !== id)); };

    return <main className="profile-page"><p className="eyebrow">Private profile</p><h1>{user.role === "doctor" ? "Your clinician profile" : "Your health profile"}</h1><p>{message}</p><form onSubmit={save} className="profile-form"><label>Preferred language<input value={form.preferred_language || ""} onChange={(event) => setForm({ ...form, preferred_language: event.target.value })} /></label><label>Phone<input value={form.phone || ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>{user.role === "doctor" ? <><label>Specialization<input value={form.specialization || ""} onChange={(event) => setForm({ ...form, specialization: event.target.value })} /></label><label>Languages, separated by commas<input value={form.languages || ""} onChange={(event) => setForm({ ...form, languages: event.target.value })} /></label><label>Years of experience<input type="number" min="0" value={form.experience_years || 0} onChange={(event) => setForm({ ...form, experience_years: event.target.value })} /></label></> : <><label>Medical history<textarea value={form.medical_history || ""} onChange={(event) => setForm({ ...form, medical_history: event.target.value })} /></label><label>Allergies<textarea value={form.allergies || ""} onChange={(event) => setForm({ ...form, allergies: event.target.value })} /></label></>}<button className="button" type="submit">Save profile</button></form>{user.role === "doctor" && <section><h2>Availability</h2><form onSubmit={addAvailability}><select value={slot.weekday} onChange={(event) => setSlot({ ...slot, weekday: Number(event.target.value) })}>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => <option key={day} value={index}>{day}</option>)}</select><input type="time" value={slot.start_time} onChange={(event) => setSlot({ ...slot, start_time: event.target.value })} /><input type="time" value={slot.end_time} onChange={(event) => setSlot({ ...slot, end_time: event.target.value })} /><input type="number" min="15" step="15" value={slot.slot_minutes} onChange={(event) => setSlot({ ...slot, slot_minutes: Number(event.target.value) })} /><button className="button" type="submit">Add hours</button></form>{availability.map((item) => <p key={item.id}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][item.weekday]} {item.start_time}–{item.end_time} ({item.slot_minutes} min) <button onClick={() => removeAvailability(item.id)}>Remove</button></p>)}</section>}</main>;
}

export default Profile;
