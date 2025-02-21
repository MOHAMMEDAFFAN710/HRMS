import React from "react";
import "../styles/telemedicine.css";
const Telemedicine = () => {
return (
    <div className="telemedicine-container">
    <h1>Telemedicine Consultation</h1>

      {/* Video Call Section */}
    <div className="video-section">
        <p>Doctor-Patient Video Call Interface (To be implemented)</p>
    </div>

      {/* Appointment Booking Form */}
    <div className="appointment-form">
        <h2>Book an Appointment</h2>
        <form>
        <input type="text" placeholder="Your Name" required />
        <input type="email" placeholder="Email" required />
        <input type="datetime-local" required />
        <button type="submit">Book Now</button>
        </form>
    </div>

      {/* Patient Medical Records */}
    <div className="medical-records">
        <h2>Your Medical History</h2>
        <p>Previous consultations and prescriptions (To be fetched from backend)</p>
    </div>
    </div>
);
};

export default Telemedicine;
