import React, { useEffect, useState } from "react";
import { getAppointments } from "../services/api"; // Import API function

const AppointmentList = () => {
    const [appointments, setAppointments] = useState([]); // Initialize as empty array
    const [loading, setLoading] = useState(true); // Track loading state
    const [error, setError] = useState(null); // Track errors

    useEffect(() => {
        getAppointments()
            .then(data => {
                if (Array.isArray(data)) {
                    setAppointments(data);
                } else {
                    console.error("Unexpected data format:", data);
                    setError("Failed to load appointments.");
                }
            })
            .catch(error => {
                console.error("Error fetching appointments:", error);
                setError("Error fetching appointments. Please try again.");
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="centered-content">
            <h2><center>Appointments</center></h2>

            {loading ? (
                <p>Loading appointments...</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : appointments.length > 0 ? (
                <ul>
                    {appointments.map(appointment => (
                        <li key={appointment.id || Math.random()}>
                            {appointment.doctor_name} - {appointment.date}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No appointments available.</p>
            )}
        </div>
    );
};

export default AppointmentList;
