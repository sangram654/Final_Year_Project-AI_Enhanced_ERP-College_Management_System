import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiBookOpen, FiAlertTriangle, FiDollarSign } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import '../student/StudentPages.css';

const LibrarianDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalBooks: 0, totalIssued: 0, overdueBooks: 0, totalFineCollected: 0 });
    const [recentIssues, setRecentIssues] = useState([]);

    useEffect(() => { fetchDashboard(); }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/library/dashboard');
            if (res.data.success) {
                setStats(res.data.data.stats);
                setRecentIssues(res.data.data.recentIssues || []);
            }
        } catch (error) {
            console.error('Error:', error);
            setStats({ totalBooks: 0, totalIssued: 0, overdueBooks: 0, totalFineCollected: 0 });
            setRecentIssues([]);
        }
        setLoading(false);
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>📚 Library Dashboard</h1>
                    <p>Welcome, {user?.firstName}! Manage the college library system.</p>
                </div>
            </div>

            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-icon total"><FiBook /></div>
                    <div className="summary-content"><h3>{stats.totalBooks}</h3><p>Total Books</p></div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon percentage"><FiBookOpen /></div>
                    <div className="summary-content"><h3>{stats.totalIssued}</h3><p>Currently Issued</p></div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon absent"><FiAlertTriangle /></div>
                    <div className="summary-content"><h3>{stats.overdueBooks}</h3><p>Overdue Books</p></div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon present"><FiDollarSign /></div>
                    <div className="summary-content"><h3>₹{stats.totalFineCollected}</h3><p>Fine Collected</p></div>
                </div>
            </div>

            <div className="section-card">
                <div className="section-header"><h2>Quick Actions</h2></div>
                <div style={{ padding: 'var(--spacing-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-4)' }}>
                    <Link to="/librarian/books" className="btn btn-primary"><FiBook /> Manage Books</Link>
                    <Link to="/librarian/issue" className="btn btn-secondary"><FiBookOpen /> Issue / Return</Link>
                </div>
            </div>

            <div className="section-card">
                <div className="section-header"><h2>Recent Activity</h2></div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr><th>Book</th><th>Student</th><th>Status</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                            {recentIssues.length > 0 ? recentIssues.slice(0, 8).map((issue, i) => (
                                <tr key={i}>
                                    <td>{issue.book?.title}</td>
                                    <td>{issue.student?.firstName} {issue.student?.lastName}</td>
                                    <td>
                                        <span style={{
                                            padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                                            background: issue.status === 'issued' ? '#fff3e0' : issue.status === 'returned' ? '#e8f5e9' : '#fce4ec',
                                            color: issue.status === 'issued' ? '#e65100' : issue.status === 'returned' ? '#2e7d32' : '#c62828',
                                        }}>
                                            {issue.status}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{new Date(issue.createdAt).toLocaleDateString()}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 30 }}>No recent activity</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LibrarianDashboard;
