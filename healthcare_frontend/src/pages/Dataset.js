import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import "../styles/Dataset.css";

const formatMonth = (month) => new Date(`${month}-15T12:00:00`).toLocaleDateString([], { month: "short" });

const Dataset = () => {
    const [dataset, setDataset] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All statuses");
    const [error, setError] = useState("");

    useEffect(() => {
        API.getHistoricalAppointments()
            .then(({ data }) => setDataset(data))
            .catch(() => setError("Historical appointment data could not be loaded."));
    }, []);

    const filteredAppointments = useMemo(() => {
        if (!dataset) return [];
        const query = search.trim().toLowerCase();
        return dataset.appointments.filter((appointment) => {
            const matchesStatus = statusFilter === "All statuses" || appointment.status === statusFilter;
            const matchesSearch = !query || Object.values(appointment).some((value) => value.toLowerCase().includes(query));
            return matchesStatus && matchesSearch;
        });
    }, [dataset, search, statusFilter]);

    if (error) return <main className="dataset-page"><p className="dataset-error" role="alert">{error}</p></main>;
    if (!dataset) return <main className="dataset-page"><p>Loading historical appointments...</p></main>;

    const completed = dataset.statuses.find(({ status }) => status === "Completed")?.count || 0;
    const busiestMonth = dataset.months.reduce((best, month) => month.count > best.count ? month : best, dataset.months[0]);
    const peak = Math.max(...dataset.months.map(({ count }) => count));

    return (
        <main className="dataset-page">
            <header className="dataset-header">
                <div>
                    <p className="dataset-kicker">PROJECT DATA / HISTORICAL</p>
                    <h1>Appointment dataset</h1>
                    <p>Historical sample records from 2023, kept separate from live patient bookings.</p>
                </div>
                <span className="dataset-total"><strong>{dataset.total}</strong> records</span>
            </header>

            <section className="dataset-overview" aria-label="Dataset overview">
                <article><span>Records</span><strong>{dataset.total}</strong><small>Across the full year</small></article>
                <article><span>Completed</span><strong>{completed}</strong><small>{Math.round((completed / dataset.total) * 100)}% of appointments</small></article>
                <article><span>Busiest month</span><strong>{formatMonth(busiestMonth.month)}</strong><small>{busiestMonth.count} appointments</small></article>
                <article><span>Patients</span><strong>{new Set(dataset.appointments.map(({ patient_id }) => patient_id)).size}</strong><small>Unique patient IDs</small></article>
            </section>

            <section className="dataset-analysis">
                <div className="dataset-panel status-panel">
                    <div className="dataset-panel-heading"><h2>By outcome</h2><span>{dataset.statuses.length} categories</span></div>
                    {dataset.statuses.map(({ status, count }) => (
                        <div className="status-line" key={status}>
                            <div><span>{status}</span><strong>{count}</strong></div>
                            <span className="status-track"><span className={`status-fill status-fill-${status.toLowerCase().replace("-", "")}`} style={{ width: `${(count / dataset.total) * 100}%` }} /></span>
                        </div>
                    ))}
                </div>
                <div className="dataset-panel monthly-panel">
                    <div className="dataset-panel-heading"><h2>Appointments by month</h2><span>2023</span></div>
                    <div className="month-chart" role="img" aria-label="Bar chart showing appointments per month">
                        {dataset.months.map(({ month, count }) => (
                            <div className="month-column" key={month} title={`${formatMonth(month)}: ${count}`}>
                                <span className="month-count">{count}</span>
                                <span className="month-bar" style={{ height: `${Math.max((count / peak) * 100, 5)}%` }} />
                                <span className="month-label">{formatMonth(month)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="dataset-records">
                <div className="records-heading"><div><h2>All records</h2><span>{filteredAppointments.length} shown</span></div>
                    <div className="records-controls">
                        <label><span className="sr-only">Search appointments</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, reason..." /></label>
                        <label><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option>{dataset.statuses.map(({ status }) => <option key={status}>{status}</option>)}</select></label>
                    </div>
                </div>
                <div className="dataset-table-wrap"><table>
                    <thead><tr><th>Appointment</th><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Visit reason</th><th>Status</th></tr></thead>
                    <tbody>{filteredAppointments.map((appointment) => (
                        <tr key={appointment.appointment_id}>
                            <td>{appointment.appointment_id}</td><td>{appointment.appointment_date}</td><td>{appointment.appointment_time}</td>
                            <td>{appointment.patient_id}</td><td>{appointment.doctor_id}</td><td>{appointment.reason_for_visit}</td>
                            <td><span className={`dataset-badge badge-${appointment.status.toLowerCase().replace("-", "")}`}>{appointment.status}</span></td>
                        </tr>
                    ))}</tbody>
                </table>{!filteredAppointments.length && <p className="dataset-empty">No records match these filters.</p>}</div>
            </section>
        </main>
    );
};

export default Dataset;