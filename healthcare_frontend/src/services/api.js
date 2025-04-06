import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/";

// Fetch appointments from Django backend
export const getAppointments = async () => {
    try {
        const response = await axios.get(`${API_URL}appointments/`);
        console.log("API Response:", response.data); // Debugging response
        return response.data || []; // Ensure it always returns an array
    } catch (error) {
        console.error("Error fetching appointments:", error);
        return []; // Return empty array if error occurs
    }
};
