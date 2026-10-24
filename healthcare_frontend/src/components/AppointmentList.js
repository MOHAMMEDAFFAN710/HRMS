import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/Appointment.css";
import "../styles/profile.css";

const AppointmentList = () => {
    const { user } = useContext(AuthContext); const [appointments, setAppointments] = useState([]); const [error, setError] = useState("");
    const load = async () => { try { const { data } = await API.getAppointments(); setAppointments(data); } catch (requestError) { setError("Appointments are temporarily unavailable."); } };
    useEffect(() => { load(); }, []);
    const transition = async (appointment, nextStatus) => { try { await API.transitionAppointment(appointment.id, nextStatus); await load(); } catch (requestError) { setError(requestError.response?.data?.error || "That update could not be saved."); } };
    return <main className="appoint-main"><header className="appointment-top"><div><p className="eyebrow">{user?.role === "doctor" ? "Clinical schedule" : "Your care timeline"}</p><h1>Appointments</h1><p>Every visit has a clear next step, from request to completed consultation.</p></div><Link className="button" to="/telemedicine">Find a clinician</Link></header>{error && <p role="alert">{error}</p>}<div className="appointment-list">{appointments.map((appointment) => <article className="appointment-row" key={appointment.id}><div><strong>{new Date(appointment.start_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</strong><span>{user?.role === "doctor" ? `Patient: ${appointment.patient?.user?.first_name || appointment.patient?.user?.username}` : `Dr. ${appointment.doctor?.user?.last_name || appointment.doctor?.user?.username}`}</span><small>{appointment.reason || "Telehealth consultation"}</small></div><div><b className={`status status-${appointment.status.toLowerCase()}`}>{appointment.status.replace("_", " ")}</b>{user?.role === "doctor" && appointment.status === "BOOKED" && <button onClick={() => transition(appointment, "CONFIRMED")}>Confirm</button>}{["BOOKED", "CONFIRMED"].includes(appointment.status) && <button onClick={() => transition(appointment, "CANCELLED")}>Cancel</button>}{["CONFIRMED", "IN_PROGRESS"].includes(appointment.status) && <Link className="appointment-call-link" to={`/video-consult?appointment=${appointment.id}`}>Join video consultation <span aria-hidden="true">↗</span></Link>}</div></article>)}{!appointments.length && <p>No appointments are scheduled.</p>}</div></main>;
};

export default AppointmentList;