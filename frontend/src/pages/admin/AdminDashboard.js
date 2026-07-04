import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiDollarSign, FiCalendar, FiFileText, FiTrendingUp, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import io from 'socket.io-client';
import '../student/StudentPages.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        feeCollected: 0,
        pendingLeaves: 0,
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [departmentDistribution, setDepartmentDistribution] = useState([]);
    
    // 🔥 ADD STATE (NEW)
    const [attendance, setAttendance] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (!user) return;
        
        const socketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000`;
        const socket = io(socketUrl);
        
        socket.on('connect', () => {
            console.log("🔌 Admin Connected to socket server");
            socket.emit('register-user', { userId: user.id || user._id, role: user.role });
        });
        
        socket.on('new-activity-log', (newLog) => {
            setRecentActivities(prev => {
                if (prev.some(act => act.id === `activity-${newLog._id}`)) return prev;
                
                const formatted = {
                    id: `activity-${newLog._id}`,
                    message: newLog.message,
                    time: new Date(newLog.timestamp).toLocaleString()
                };
                return [formatted, ...prev].slice(0, 8);
            });
        });
        
        return () => {
            socket.disconnect();
        };
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/admin/dashboard');
            if (res.data.success) {
                const data = res.data.data;
                setStats({
                    totalStudents: data.counts?.students || 0,
                    totalTeachers: data.counts?.teachers || 0,
                    feeCollected: data.fees?.collected || 0,
                    pendingLeaves: data.pending?.leaves || 0,
                });

                setDepartmentDistribution(data.departmentDistribution || []);

                const paymentActivities = (data.recent?.payments || []).map((payment) => {
                    const fullName = payment.student?.user
                        ? `${payment.student.user.firstName || ''} ${payment.student.user.lastName || ''}`.trim()
                        : 'Student';

                    return {
                        id: `payment-${payment._id}`,
                        message: `Fee payment received: Rs ${(payment.amount || 0).toLocaleString()} from ${fullName}`,
                        time: new Date(payment.createdAt || payment.paymentDate).toLocaleString(),
                        rawTime: new Date(payment.createdAt || payment.paymentDate || 0).getTime(),
                    };
                });

                const registrationActivities = (data.recent?.registrations || []).map((registration) => ({
                    id: `registration-${registration._id}`,
                    message: `New user registration: ${registration.firstName || ''} ${registration.lastName || ''}`.trim(),
                    time: new Date(registration.createdAt).toLocaleString(),
                    rawTime: new Date(registration.createdAt || 0).getTime(),
                }));

                let attendanceActivities = [];
                try {
                    const logsRes = await api.get('/activity-logs');
                    if (logsRes.data.success) {
                        attendanceActivities = logsRes.data.data.map(log => ({
                            id: `activity-${log._id}`,
                            message: log.message,
                            time: new Date(log.timestamp).toLocaleString(),
                            rawTime: new Date(log.timestamp).getTime(),
                        }));
                    }
                } catch (err) {
                    console.error("Error fetching activity logs:", err);
                }

                const mergedActivities = [...paymentActivities, ...registrationActivities, ...attendanceActivities]
                    .sort((a, b) => b.rawTime - a.rawTime)
                    .slice(0, 8)
                    .map(({ rawTime, ...activity }) => activity);

                setRecentActivities(mergedActivities);
            }

            // 🔥 Attendance fetch (NEW)
            try {
                const attendanceRes = await api.get('/attendance/all');
                if (attendanceRes.data.success) {
                    setAttendance(attendanceRes.data.data);
                }
            } catch (err) {
                console.error("Attendance fetch error:", err);
            }

        } catch (error) {
            console.error('Error fetching dashboard:', error);
            setStats({
                totalStudents: 0,
                totalTeachers: 0,
                feeCollected: 0,
                pendingLeaves: 0,
            });
            setRecentActivities([]);
            setDepartmentDistribution([]);
        }

        setLoading(false);
    };

    const formatCurrency = (amount) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        }
        return `₹${amount.toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="student-page animate-fade-in">
            {/* Welcome Header */}
            <div className="page-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Welcome back, {user?.firstName || 'Admin'}! Here's your overview.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-icon total">
                        <FiUsers />
                    </div>
                    <div className="summary-content">
                        <h3>{stats.totalStudents}</h3>
                        <p>Total Students</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon percentage">
                        <FiUsers />
                    </div>
                    <div className="summary-content">
                        <h3>{stats.totalTeachers}</h3>
                        <p>Total Teachers</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon present">
                        <FiDollarSign />
                    </div>
                    <div className="summary-content">
                        <h3>{formatCurrency(stats.feeCollected)}</h3>
                        <p>Fee Collected</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon absent">
                        <FiAlertTriangle />
                    </div>
                    <div className="summary-content">
                        <h3>{stats.pendingLeaves}</h3>
                        <p>Pending Leaves</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="section-card">
                <div className="section-header">
                    <h2>Quick Actions</h2>
                </div>
                <div style={{ padding: 'var(--spacing-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-4)' }}>
                    <Link to="/admin/students" className="btn btn-primary">
                        <FiUsers /> Manage Students
                    </Link>
                    <Link to="/admin/teachers" className="btn btn-secondary">
                        <FiUsers /> Manage Teachers
                    </Link>
                    <Link to="/admin/fees" className="btn btn-secondary">
                        <FiDollarSign /> Fee Management
                    </Link>
                    <Link to="/admin/leaves" className="btn btn-secondary">
                        <FiCalendar /> Leave Approval
                    </Link>
                    <Link to="/admin/reports" className="btn btn-secondary">
                        <FiFileText /> Reports
                    </Link>
                </div>
            </div>

            {/* 🔥 Attendance Section (NEW) */}
            <div className="section-card">
                <div className="section-header">
                    <h2>Attendance Overview</h2>
                </div>
                <div style={{ padding: 'var(--spacing-6)' }}>
                    {attendance.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No attendance found</p>
                    ) : (
                        attendance.slice(0, 10).map((a) => (
                            <div key={a._id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                                <strong>
                                    {a.student?.user?.firstName} {a.student?.user?.lastName}
                                </strong>
                                {" "} - {a.status}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="section-card">
                <div className="section-header">
                    <h2><FiTrendingUp style={{ marginRight: 8 }} /> Recent Activity</h2>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Activity</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivities.length > 0 ? recentActivities.map((activity) => (
                                <tr key={activity.id}>
                                    <td>{activity.message}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{activity.time}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Department Overview */}
            <div className="section-card">
                <div className="section-header">
                    <h2>Department Overview</h2>
                </div>
                <div style={{ padding: 'var(--spacing-6)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
                        {departmentDistribution.length > 0 ? departmentDistribution.map((dept, idx) => (
                            <div key={`${dept._id}-${idx}`} style={{ padding: 'var(--spacing-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                                <h4 style={{ marginBottom: 'var(--spacing-2)' }}>{dept._id || 'Unspecified Department'}</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    {dept.count || 0} Students
                                </p>
                            </div>
                        )) : (
                            <p style={{ color: 'var(--text-muted)' }}>No department data available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;