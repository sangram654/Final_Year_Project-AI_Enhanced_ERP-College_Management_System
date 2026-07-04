import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    FiUsers, FiShield, FiActivity, FiSettings,
    FiTrendingUp, FiUserCheck, FiUserX, FiPlusCircle,
    FiCalendar
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import io from 'socket.io-client';
import '../student/StudentPages.css';

const SuperAdminDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        userCounts: {},
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    const fetchDashboardData = useCallback(async () => {
        try {
            const res = await api.get('/super-admin/dashboard');
            if (res.data.success) {
                const d = res.data.data;
                setStats({
                    totalUsers: d.totalUsers,
                    activeUsers: d.activeUsers,
                    inactiveUsers: d.inactiveUsers,
                    userCounts: d.userCounts,
                });
                setRecentUsers(d.recentUsers || []);
            }

            // Fetch actual system activity logs
            try {
                const logsRes = await api.get('/activity-logs');
                if (logsRes.data.success) {
                    const formatted = logsRes.data.data.map(log => ({
                        id: log._id,
                        message: log.message,
                        time: new Date(log.timestamp).toLocaleString()
                    }));
                    setRecentActivities(formatted);
                }
            } catch (err) {
                console.error("Error fetching super admin activity logs:", err);
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            setStats({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0, userCounts: {} });
            setRecentUsers([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        if (!user) return;
        
        const socketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000`;
        const socket = io(socketUrl);
        
        socket.on('connect', () => {
            console.log("🔌 Super Admin Connected to socket server");
            socket.emit('register-user', { userId: user.id || user._id, role: user.role });
        });
        
        socket.on('new-activity-log', (newLog) => {
            setRecentActivities(prev => {
                if (prev.some(act => act.id === newLog._id)) return prev;
                
                const formatted = {
                    id: newLog._id,
                    message: newLog.message,
                    time: new Date(newLog.timestamp).toLocaleString()
                };
                return [formatted, ...prev].slice(0, 10);
            });
        });
        
        return () => {
            socket.disconnect();
        };
    }, [user]);

    const getRoleBadgeColor = (role) => {
        const colors = {
            super_admin: '#e74c3c',
            admin: '#8e44ad',
            teacher: '#2980b9',
            student: '#27ae60',
            parent: '#f39c12',
            accountant: '#1abc9c',
            librarian: '#e67e22',
            receptionist: '#3498db',
        };
        return colors[role] || '#95a5a6';
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
            <div className="page-header">
                <div>
                    <h1>🛡️ Super Admin Dashboard</h1>
                    <p>Welcome, {user?.firstName || 'Super Admin'}! Complete system control at your fingertips.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-icon total"><FiUsers /></div>
                    <div className="summary-content">
                        <h3>{stats.totalUsers}</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon present"><FiUserCheck /></div>
                    <div className="summary-content">
                        <h3>{stats.activeUsers}</h3>
                        <p>Active Users</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon absent"><FiUserX /></div>
                    <div className="summary-content">
                        <h3>{stats.inactiveUsers}</h3>
                        <p>Inactive Users</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon percentage"><FiShield /></div>
                    <div className="summary-content">
                        <h3>{Object.keys(stats.userCounts).length}</h3>
                        <p>Active Roles</p>
                    </div>
                </div>
            </div>

            {/* Role Distribution */}
            <div className="section-card">
                <div className="section-header">
                    <h2><FiActivity style={{ marginRight: 8 }} /> Users by Role</h2>
                </div>
                <div style={{ padding: 'var(--spacing-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--spacing-4)' }}>
                    {Object.entries(stats.userCounts).map(([role, count]) => (
                        <div key={role} style={{
                            padding: 'var(--spacing-4)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-color)',
                            textAlign: 'center'
                        }}>
                            <span style={{
                                display: 'inline-block',
                                padding: '2px 10px',
                                borderRadius: '12px',
                                background: getRoleBadgeColor(role),
                                color: '#fff',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                marginBottom: '8px',
                                textTransform: 'capitalize',
                            }}>
                                {role.replace('_', ' ')}
                            </span>
                            <h3 style={{ margin: 0 }}>{count}</h3>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="section-card">
                <div className="section-header">
                    <h2><FiSettings style={{ marginRight: 8 }} /> Quick Actions</h2>
                </div>
                <div style={{ padding: 'var(--spacing-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-4)' }}>
                    <Link to="/super-admin/users" className="btn btn-primary">
                        <FiUsers /> Manage Users
                    </Link>
                    <Link to="/super-admin/roles" className="btn btn-secondary">
                        <FiShield /> View Roles
                    </Link>
                    <Link to="/super-admin/create-user" className="btn btn-secondary">
                        <FiPlusCircle /> Create User
                    </Link>
                    <Link to="/admin/dashboard" className="btn btn-secondary">
                        <FiTrendingUp /> Admin Panel
                    </Link>
                </div>
            </div>

            {/* Recent Users */}
            <div className="section-card">
                <div className="section-header">
                    <h2><FiTrendingUp style={{ marginRight: 8 }} /> Recent Users</h2>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentUsers.slice(0, 10).map((u) => (
                                <tr key={u._id}>
                                    <td>{u.firstName} {u.lastName}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                                    <td>
                                        <span style={{
                                            padding: '2px 10px',
                                            borderRadius: '12px',
                                            background: getRoleBadgeColor(u.role),
                                            color: '#fff',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            textTransform: 'capitalize',
                                        }}>
                                            {u.role?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            color: u.isActive ? '#27ae60' : '#e74c3c',
                                            fontWeight: 600,
                                        }}>
                                            {u.isActive ? '● Active' : '● Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Activity Logs */}
            <div className="section-card" style={{ marginTop: '20px' }}>
                <div className="section-header">
                    <h2><FiCalendar style={{ marginRight: 8 }} /> Recent Activity Logs</h2>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Activity Message</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivities.length > 0 ? (
                                recentActivities.map((activity) => (
                                    <tr key={activity.id}>
                                        <td>{activity.message}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{activity.time}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity logs found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default SuperAdminDashboard;