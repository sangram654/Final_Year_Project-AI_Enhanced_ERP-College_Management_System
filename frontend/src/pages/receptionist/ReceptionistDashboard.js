import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiClipboard, FiUserPlus, FiPhone, FiAlertCircle, FiPlus } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import '../student/StudentPages.css';

const ReceptionistDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ todayEntries: 0, totalInquiries: 0, openComplaints: 0, todayVisitors: 0 });
    const [recentEntries, setRecentEntries] = useState([]);

    useEffect(() => { fetchDashboard(); }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/front-office/dashboard');
            if (res.data.success) {
                setStats(res.data.data.stats);
                setRecentEntries(res.data.data.recentEntries || []);
            }
        } catch (error) {
            console.error('Error:', error);
            setStats({ todayEntries: 0, totalInquiries: 0, openComplaints: 0, todayVisitors: 0 });
            setRecentEntries([]);
        }
        setLoading(false);
    };

    const getTypeLabel = (type) => {
        const labels = {
            admission_inquiry: '📝 Admission', visitor: '👤 Visitor', phone_call: '📞 Phone Call',
            postal: '📮 Postal', complaint: '⚠️ Complaint', general: '📋 General',
        };
        return labels[type] || type;
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>🏢 Receptionist Dashboard</h1>
                    <p>Welcome, {user?.firstName}! Front office operations overview.</p>
                </div>
            </div>

            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-icon total"><FiClipboard /></div>
                    <div className="summary-content"><h3>{stats.todayEntries}</h3><p>Today's Entries</p></div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon percentage"><FiUserPlus /></div>
                    <div className="summary-content"><h3>{stats.totalInquiries}</h3><p>Admission Inquiries</p></div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon present"><FiPhone /></div>
                    <div className="summary-content"><h3>{stats.todayVisitors}</h3><p>Today Visitors</p></div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon absent"><FiAlertCircle /></div>
                    <div className="summary-content"><h3>{stats.openComplaints}</h3><p>Open Complaints</p></div>
                </div>
            </div>

            <div className="section-card">
                <div className="section-header"><h2>Quick Actions</h2></div>
                <div style={{ padding: 'var(--spacing-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-4)' }}>
                    <Link to="/receptionist/front-office" className="btn btn-primary"><FiPlus /> New Entry</Link>
                    <Link to="/receptionist/visitors" className="btn btn-secondary"><FiClipboard /> Visitor Log</Link>
                    <Link to="/receptionist/inquiries" className="btn btn-secondary"><FiUserPlus /> Inquiries</Link>
                    <Link to="/receptionist/student-info" className="btn btn-secondary"><FiPhone /> Student Info</Link>
                    <Link to="/receptionist/communicate" className="btn btn-secondary"><FiAlertCircle /> Communicate</Link>
                </div>
            </div>

            <div className="section-card">
                <div className="section-header"><h2>Recent Entries</h2></div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr><th>Type</th><th>Name</th><th>Purpose</th><th>Status</th><th>Time</th></tr>
                        </thead>
                        <tbody>
                            {recentEntries.length > 0 ? recentEntries.slice(0, 8).map((entry, i) => (
                                <tr key={i}>
                                    <td>{getTypeLabel(entry.type)}</td>
                                    <td><strong>{entry.visitorName}</strong></td>
                                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.purpose}</td>
                                    <td>
                                        <span style={{
                                            padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                                            background: entry.status === 'open' ? '#fff3e0' : entry.status === 'closed' ? '#e8f5e9' : '#e3f2fd',
                                            color: entry.status === 'open' ? '#e65100' : entry.status === 'closed' ? '#2e7d32' : '#1565c0',
                                        }}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{new Date(entry.createdAt).toLocaleString()}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 30 }}>No entries today</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReceptionistDashboard;
