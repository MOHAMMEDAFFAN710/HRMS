import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api/";
const API = axios.create({ baseURL: API_URL, timeout: 15000 });

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Token ${token}`;
    return config;
});

const api = {
    register: (data) => API.post("register/", data),
    login: (data) => API.post("login/", data),
    logout: () => API.post("logout/"),
    getCurrentUser: () => API.get("current-user/"),
    updateCurrentUser: (data) => API.patch("current-user/", data),
    getDoctors: (params) => API.get("doctors/", { params }),
    getDoctorSlots: (doctorId, params) => API.get(`doctors/${doctorId}/slots/`, { params }),
    getPatientProfile: () => API.get("patients/current_patient/"),
    updatePatientProfile: (data) => API.patch("patients/current_patient/", data),
    getDoctorProfile: () => API.get("doctors/current_doctor/"),
    updateDoctorProfile: (data) => API.patch("doctors/current_doctor/", data),
    getAvailability: () => API.get("availability/"),
    createAvailability: (data) => API.post("availability/", data),
    deleteAvailability: (id) => API.delete(`availability/${id}/`),
    getAppointments: () => API.get("appointments/"),
    getHistoricalAppointments: () => API.get("historical-appointments/"),
    createAppointment: (data) => API.post("appointments/", data),
    transitionAppointment: (id, status) => API.post(`appointments/${id}/transition/`, { status }),
    createConsultation: (appointmentId) => API.post("consultations/", { appointment_id: appointmentId }),
    getConsultations: () => API.get("consultations/"),
    getConsultationSocketTicket: (id) => API.post(`consultations/${id}/socket-ticket/`),
    getConsultationIceConfiguration: (id) => API.get(`consultations/${id}/ice-configuration/`),
    startConsultation: (id) => API.post(`consultations/${id}/start/`),
    endConsultation: (id, notes) => API.post(`consultations/${id}/end/`, { notes }),
    getPrescriptions: () => API.get("prescriptions/"),
    createPrescription: (data) => API.post("prescriptions/", data),
    getMessages: (consultationId) => API.get("messages/", { params: { consultation: consultationId } }),
    sendMessage: (data) => API.post("messages/", data),
    getNotifications: () => API.get("notifications/"),
    markNotificationRead: (id) => API.patch(`notifications/${id}/`, { read: true }),
};

export const getAppointments = api.getAppointments;
export { API };
export default api;
