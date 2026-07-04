import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    FiCalendar, FiDollarSign, FiBook, FiFileText,
    FiAward, FiClock, FiTrendingUp, FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api, { feeService, marksService } from '../../services/api';
import io from 'socket.io-client';
import './DashboardPages.css';

const StudentDashboard = () => {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        attendance: { percentage: 0, total: 0, present: 0 },
        fees: { total: 0, paid: 0, due: 0 },
        recentMarks: [],
        backlogs: 0,
    });
    const [recentActivities, setRecentActivities] = useState([]);

    const fetchDashboardData = useCallback(async () => {
        if (!profile?._id) {
            setLoading(false);
            return;
        }

        try {
            // Fetch biometric attendance summary
            let bioPercent = 0;
            let bioPresent = 0;
            let bioTotal = 24;

            try {
                const bioRes = await api.get('/student/my-attendance');
                if (bioRes.data.success && bioRes.data.data) {
                    const logs = bioRes.data.data;
                    const termStart = new Date('2025-07-01');
                    const today = new Date();
                    const termLogs = logs.filter(l => {
                        const logDate = new Date(l.time);
                        return logDate >= termStart && logDate <= today;
                    });
                    
                    bioPresent = new Set(termLogs.map(l => new Date(l.time).toDateString())).size;
                    
                    // Calculate total weekdays in term
                    let weekdays = 0;
                    const tempDate = new Date(termStart);
                    while (tempDate <= today) {
                        if (tempDate.getDay() !== 0) { // Skip Sundays
                            weekdays++;
                        }
                        tempDate.setDate(tempDate.getDate() + 1);
                    }
                    
                    bioTotal = weekdays || 24;
                    bioPercent = parseFloat(((bioPresent / bioTotal) * 100).toFixed(1));
                    if (bioPercent > 100) bioPercent = 100;
                }
            } catch (err) {
                console.error("Error fetching biometric attendance for dashboard:", err);
            }

            // Fetch fee summary
            const feeRes = await feeService.getStudentFees(profile._id);

            // Fetch backlogs
            const backlogRes = await marksService.getBacklogs(profile._id, { status: 'Open' });

            setDashboardData({
                attendance: { percentage: bioPercent, total: bioTotal, present: bioPresent },
                fees: feeRes.data.summary || { total: 0, paid: 0, due: 0 },
                recentMarks: [],
                backlogs: backlogRes.data.summary?.open || 0,
            });

            // Fetch actual student activity logs
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
                console.error("Error fetching student activity logs:", err);
                setRecentActivities([]);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
        setLoading(false);
    }, [profile]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        if (!user) return;
        
        const socketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000`;
        const socket = io(socketUrl);
        
        socket.on('connect', () => {
            console.log("🔌 Student Connected to socket server");
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

    const quickActions = [
        { icon: FiCalendar, label: 'View Attendance', path: '/student/attendance', color: 'primary' },
        { icon: FiDollarSign, label: 'Pay Fees', path: '/student/fees', color: 'success' },
        { icon: FiBook, label: 'View Marks', path: '/student/marks', color: 'warning' },
        { icon: FiFileText, label: 'Study Materials', path: '/student/notes', color: 'info' },
        { icon: FiClock, label: 'Apply Leave', path: '/student/leave', color: 'secondary' },
        { icon: FiAward, label: 'Scholarships', path: '/student/scholarship', color: 'accent' },
    ];

    const statsCards = [
        {
            icon: FiCalendar,
            label: 'Attendance',
            value: `${dashboardData.attendance.percentage}%`,
            subtitle: `${dashboardData.attendance.present}/${dashboardData.attendance.total} days`,
            color: dashboardData.attendance.percentage >= 75 ? 'success' : 'warning'
        },
        {
            icon: FiDollarSign,
            label: 'Fee Status',
            value: `₹${(dashboardData.fees.due || 0).toLocaleString()}`,
            subtitle: dashboardData.fees.due > 0 ? 'Pending' : 'All Clear',
            color: dashboardData.fees.due > 0 ? 'error' : 'success'
        },
        {
            icon: FiAlertCircle,
            label: 'Backlogs',
            value: dashboardData.backlogs,
            subtitle: dashboardData.backlogs > 0 ? 'Subjects pending' : 'None',
            color: dashboardData.backlogs > 0 ? 'error' : 'success'
        },
        {
            icon: FiTrendingUp,
            label: 'Semester',
            value: profile?.semester || '-',
            subtitle: profile?.department?.split(' ')[0] || '-',
            color: 'primary'
        },
    ];

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page animate-fade-in">
            {/* Welcome Section */}
            <div className="welcome-section">
                <div className="welcome-content">
                    <h1>Welcome back, {user?.firstName}! 👋</h1>
                    <p>Here's an overview of your academic progress</p>
                </div>
                <div className="welcome-info">
                    <span className="badge badge-primary">{profile?.rollNumber}</span>
                    <span className="badge badge-info">{profile?.department}</span>
                    <span className="badge badge-success">Semester {profile?.semester}</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {statsCards.map((stat, index) => (
                    <div key={index} className={`stat-card ${stat.color}`}>
                        <div className="stat-icon">
                            <stat.icon />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-value">{stat.value}</h3>
                            <p className="stat-label">{stat.label}</p>
                            <span className="stat-subtitle">{stat.subtitle}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="section-card">
                <div className="section-header">
                    <h2>Quick Actions</h2>
                </div>
                <div className="quick-actions-grid">
                    {quickActions.map((action, index) => (
                        <Link key={index} to={action.path} className={`quick-action-card ${action.color}`}>
                            <div className="action-icon">
                                <action.icon />
                            </div>
                            <span className="action-label">{action.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="dashboard-grid-2">
                {/* Recent Activity */}
                <div className="section-card">
                    <div className="section-header">
                        <h2>Recent Activity</h2>
                    </div>
                    <div className="activity-list">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity) => (
                                <div className="activity-item" key={activity.id}>
                                    <div className="activity-icon success">
                                        <FiCalendar />
                                    </div>
                                    <div className="activity-content">
                                        <p className="activity-title">{activity.message}</p>
                                        <p className="activity-time">{activity.time}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ padding: '20px', color: 'var(--text-muted)' }}>No recent activity</p>
                        )}
                    </div>
                </div>

                {/* Upcoming */}
                <div className="section-card">
                    <div className="section-header">
                        <h2>Upcoming</h2>
                    </div>
                    <div className="upcoming-list">
                        <div className="upcoming-item">
                            <div className="upcoming-date">
                                <span className="date-day">25</span>
                                <span className="date-month">Dec</span>
                            </div>
                            <div className="upcoming-content">
                                <p className="upcoming-title">Internal Exam</p>
                                <p className="upcoming-subtitle">Data Structures</p>
                            </div>
                        </div>
                        <div className="upcoming-item">
                            <div className="upcoming-date">
                                <span className="date-day">31</span>
                                <span className="date-month">Dec</span>
                            </div>
                            <div className="upcoming-content">
                                <p className="upcoming-title">Fee Due Date</p>
                                <p className="upcoming-subtitle">Semester 5 Fees</p>
                            </div>
                        </div>
                        <div className="upcoming-item">
                            <div className="upcoming-date">
                                <span className="date-day">05</span>
                                <span className="date-month">Jan</span>
                            </div>
                            <div className="upcoming-content">
                                <p className="upcoming-title">Project Submission</p>
                                <p className="upcoming-subtitle">Web Development Project</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
