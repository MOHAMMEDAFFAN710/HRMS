import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/AppointmentDetails.css";

const fmt = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not scheduled" : date.toLocaleString([], { dateStyle: "full", timeStyle: "short" });
};

export default function AppointmentDetails() {
  const { appointmentId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isDoctor = user?.role === "doctor";
  const load = useCallback(async () => {
    setError("");
    try {
      const { data } = await API.getAppointments();
      const rows = Array.isArray(data) ? data : (data?.results || []);
      const found = rows.find((row) => String(row.id) === String(appointmentId));
      if (!found) throw new Error("This appointment was not found in your account.");
      setAppointment(found);
    } catch (e) {
      setError(e.response?.data?.detail || e.response?.data?.error || e.message || "Could not load appointment.");
    } finally { setLoading(false); }
  }, [appointmentId]);
  useEffect(() => { load(); }, [load]);

  const transition = async (status) => {
    if (!appointment) return;
    setBusy(true); setError("");
    try {
      await API.transitionAppointment(appointment.id, status);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.detail || "Could not update this appointment.");
    } finally { setBusy(false); }
  };

  if (loading) return <main className="appointment-detail-page"><p>Loading appointment…</p></main>;
  if (!appointment) return <main className="appointment-detail-page"><p role="alert">{error || "Appointment unavailable."}</p><Link to="/appointments">Back to appointments</Link></main>;

  const status = appointment.status || "BOOKED";
  const patient = appointment.patient?.user;
  const doctor = appointment.doctor?.user;
  const participant = isDoctor
    ? (patient?.first_name || patient?.username || "Patient")
    : `Dr. ${doctor?.last_name || doctor?.username || "Clinician"}`;
  const canJoin = ["CONFIRMED", "IN_PROGRESS"].includes(status);

  return <main className="appointment-detail-page">
    <Link className="appointment-detail-back" to="/appointments">← Back to appointments</Link>
    <section className="appointment-detail-card">
      <p className="appointment-detail-eyebrow">{isDoctor ? "DOCTOR WORKSPACE" : "YOUR CARE"}</p>
      <h1>Appointment details</h1>
      <p className="appointment-detail-intro">Review the appointment before entering the private consultation room.</p>
      {error && <p className="appointment-detail-error" role="alert">{error}</p>}
      <div className="appointment-detail-status"><span>Status</span><strong>{status.replaceAll("_", " ")}</strong></div>
      <dl className="appointment-detail-grid">
        <div><dt>{isDoctor ? "Patient" : "Doctor"}</dt><dd>{participant}</dd></div>
        <div><dt>Date and time</dt><dd>{fmt(appointment.start_at)}</dd></div>
        <div><dt>Duration</dt><dd>{appointment.start_at && appointment.end_at ? `${Math.max(1, Math.round((new Date(appointment.end_at)-new Date(appointment.start_at))/60000))} minutes` : "Not specified"}</dd></div>
        <div><dt>Reason for visit</dt><dd>{appointment.reason || "Telehealth consultation"}</dd></div>
      </dl>
      {isDoctor && status === "BOOKED" && <div className="appointment-detail-actions">
        <button disabled={busy} onClick={() => transition("CONFIRMED")}>{busy ? "Saving…" : "Approve appointment"}</button>
        <button className="secondary" disabled={busy} onClick={() => transition("CANCELLED")}>Reject request</button>
      </div>}
      {!isDoctor && status === "BOOKED" && <p className="appointment-detail-note">Your request is waiting for the doctor to approve it. The consultation link will become available after approval.</p>}
      {canJoin && <div className="appointment-detail-call">
        <h2>Ready for your consultation?</h2>
        <p>{isDoctor ? "Open the consultation room and join. The patient can join the same room when ready." : "Open the dedicated video consultation page. You can check your camera and microphone before joining; the doctor must join the same room."}</p>
        <button onClick={() => navigate(`/video-consult?appointment=${encodeURIComponent(appointment.id)}`)}>Open video consultation →</button>
      </div>}
      {status === "COMPLETED" && <p className="appointment-detail-note">This consultation is marked completed.</p>}
      {status === "CANCELLED" && <p className="appointment-detail-note">This appointment was cancelled.</p>}
    </section>
  </main>;
}
