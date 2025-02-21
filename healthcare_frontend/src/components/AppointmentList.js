import React, { useEffect, useState } from "react";
import { getAppointments } from "../services/api"; // Import API function

const AppointmentList = () => {
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        getAppointments()
            .then(response => setAppointments(response.data))
            .catch(error => console.error("Error fetching appointments:", error));
    }, []);

    return (
        <div className="centered-content"><h2><center>Appointments</center></h2>
            
            <ul>
                {appointments.map(appointment => (
                    <li key={appointment.id}>
                        {appointment.doctor_name} - {appointment.date}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AppointmentList;
