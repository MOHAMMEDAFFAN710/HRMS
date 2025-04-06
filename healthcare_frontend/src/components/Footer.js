import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import { Link } from "react-router-dom";
import "../styles/Appointment.css";
import Telemedicine from "../pages/Telemedicine";
import VideoConsult from "../pages/VideoConsult";
import ChatConsult from "../pages/ChatConsult";
import { getAppointments } from "../services/api"; // Import API function

const AppointmentList = () => {
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        getAppointments()
            .then(response => setAppointments(response.data))
            .catch(error => console.error("Error fetching appointments:", error));
    }, []);

    return (
        <router>
            
        
        




            {/* <ul>
                {appointments.map(appointment => (
                    <li key={appointment.id}>
                        {appointment.doctor_name} - {appointment.date}
                    </li>
                ))}
            </ul> */}
            <div className="centered-content">
                    <Routes>
                        <Route path="/" element={
                            <div className="appoint-main"> 
                                <h2><center>Appointments</center></h2>
                                <ul>
                                    <li><link to="/telemedicine"></link></li>
                                    <li><link to="/video-consult" ></link></li>
                                    <li><link to="/telemedicine"></link></li>
                                </ul>

                            </div>
                        }/>
                        <Route path="/telemedicine" element={<Telemedicine />} />
                        <Route path="/video-consult" element={<VideoConsult />} />
                        <Route path="/chat-consult" element={<ChatConsult />} />
                    </Routes>
            </div>
        
        </router>
    );
};

export default AppointmentList;
