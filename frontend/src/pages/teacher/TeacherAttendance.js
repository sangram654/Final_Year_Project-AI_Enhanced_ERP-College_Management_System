import React, { useState, useEffect, useCallback } from 'react';
import { FiCheck, FiX, FiSave, FiCalendar, FiBook, FiCpu, FiUserPlus, FiActivity } from 'react-icons/fi';
import { MdFingerprint } from 'react-icons/md';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import io from 'socket.io-client';
import '../student/StudentPages.css';

const TeacherAttendance = () => {
    const { user } = useAuth();
    const totalStudents = 30;
    const [activeMethod, setActiveMethod] = useState('manual');
    const [deviceStatus, setDeviceStatus] = useState("Waiting for device...");
    const [biometricLogs, setBiometricLogs] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');

    const roleMapping = {
        'Teacher': 'teacher',
        'Student': 'student'
    };

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const [selectedDay, setSelectedDay] = useState(new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()));
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0, status: 'Normal' });

    const calculateStats = (logs) => {
        const today = new Date().toDateString();
        const todayLogs = logs.filter(l => new Date(l.time).toDateString() === today);
        const uniqueToday = new Set(todayLogs.map(l => l.user)).size;
        const dailyPercent = ((uniqueToday / totalStudents) * 100).toFixed(1);
        const weeklyAvg = ((logs.length / (totalStudents * 6)) * 100).toFixed(1);
        const monthlyAvg = ((logs.length / (totalStudents * 30)) * 365).toFixed(1);

        setStats({
            daily: dailyPercent > 100 ? 100 : dailyPercent,
            weekly: weeklyAvg > 100 ? 100 : weeklyAvg,
            monthly: monthlyAvg > 100 ? 100 : monthlyAvg,
            status: dailyPercent > 75 ? 'Excellent' : 'Low'
        });
    };

    const fetchActivityLogs = async () => {
        try {
            const res = await api.get('http://192.168.1.4/activity-logs');
            if (res.data.success) {
                setActivityLogs(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching activity logs:", err);
        }
    };

    useEffect(() => {
        const fetchBiometricData = async () => {
            try {
                const res = await api.get('http://192.168.1.4/attendance2');
                const data = res.data;
                if (Array.isArray(data)) {
                    setBiometricLogs(data);
                    calculateStats(data);
                }
            } catch (err) { console.log(err); }
        };
        fetchBiometricData();
        fetchActivityLogs();

        if (!user) return;
        const socketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || `http://192.168.1.4:5000`;
        const socket = io(socketUrl);

        socket.on('connect', () => {
            console.log("🔌 Teacher Attendance Socket Connected");
            socket.emit('register-user', { userId: user.id || user._id, role: user.role });
        });

        socket.on('device-status-update', (data) => setDeviceStatus(data.text));

        socket.on('new-biometric-attendance', (newData) => {
            setBiometricLogs(prev => {
                const updated = [newData, ...prev];
                calculateStats(updated);
                return updated;
            });
            toast.success(`New Entry: ID ${newData.user}`);
        });

        socket.on('new-activity-log', (newLog) => {
            setActivityLogs(prev => {
                if (prev.some(log => log._id === newLog._id)) return prev;
                return [newLog, ...prev].slice(0, 50);
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const handleStartEnrollment = async () => {
        const id = prompt("Enroll Student ID (1-64):");
        if (!id) return;
        try {
            await api.post('http://192.168.1.4/attendance2/setCommand', { mode: "ENROLL", enrollId: parseInt(id) });
            setDeviceStatus("Enrollment Mode Active...");
        } catch (err) { console.error(err); }
    };

    const handleCheckAttendance = async () => {
        try {
            setDeviceStatus("Initializing Sensor...");
            await api.post('http://192.168.1.4/attendance2/setCommand', { mode: "ATTENDANCE", enrollId: null });
        } catch (err) {
            console.error(err);
            setDeviceStatus("Error connecting to hardware");
        }
    };

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <h1>Teacher Attendance Control</h1>
                <p>Real-time Biometric Analysis</p>
            </div>

            <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                <div className="summary-card" style={{ borderLeft: '4px solid #38bdf8' }}>
                    <h3 style={{ color: '#38bdf8' }}>{stats.daily}%</h3>
                    <p>Daily Attendance</p>
                </div>
                <div className="summary-card" style={{ borderLeft: '4px solid #22c55e' }}>
                    <h3 style={{ color: '#22c55e' }}>{stats.weekly}%</h3>
                    <p>Weekly Attendance</p>
                </div>
                <div className="summary-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <h3 style={{ color: '#f59e0b' }}>{stats.monthly}%</h3>
                    <p>Yearly Attendance</p>
                </div>
                <div className="summary-card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <h3 style={{ color: '#ef4444' }}>{stats.status}</h3>
                    <p>Class Status</p>
                </div>
            </div>

            <div className="section-card" style={{ marginBottom: '20px', padding: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <FiCalendar />
                    {days.map(d => (
                        <button key={d}
                            className={`btn btn-sm ${selectedDay === d ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setSelectedDay(d)}
                        >
                            {d}
                        </button>
                    ))}
                    <select className="form-select" style={{ width: '150px' }} onChange={(e) => setSelectedMonth(e.target.value)}>
                        <option value="4">July 2025</option>
                        <option value="4">Aug 2025</option>
                        <option value="4">Sept 2025</option>
                        <option value="4">Oct 2025</option>
                        <option value="4">Nov 2025</option>
                        <option value="4">Dec 2025</option>
                        <option value="4">Jan 2026</option>
                        <option value="4">Feb 2026</option>
                        <option value="4">Mar 2026</option>
                        <option value="4">Apr 2026</option>
                        <option value="4">May 2026</option>
                        <option value="4">June 2026</option>
                    </select>
                </div>
            </div>

            {/* Role-wise Attendance Sub-Navbar */}
            <div className="sub-navbar" style={{
                display: 'flex',
                gap: '12px',
                marginTop: '30px',
                marginBottom: '25px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px',
                flexWrap: 'wrap'
            }}>
                {['All', 'Teacher', 'Student'].map((roleOpt) => (
                    <button
                        key={roleOpt}
                        onClick={() => setSelectedRoleFilter(roleOpt)}
                        className={`btn ${selectedRoleFilter === roleOpt ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                            borderRadius: '20px',
                            padding: '6px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                            border: selectedRoleFilter === roleOpt ? 'none' : '1px solid var(--border-color)',
                            background: selectedRoleFilter === roleOpt ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' : 'var(--bg-primary)',
                            color: selectedRoleFilter === roleOpt ? '#ffffff' : 'var(--text-secondary)',
                            boxShadow: selectedRoleFilter === roleOpt ? 'var(--shadow-md)' : 'none'
                        }}
                    >
                        {roleOpt === 'All' && '🌐'}
                        {roleOpt === 'Teacher' && '👨‍🏫'}
                        {roleOpt === 'Student' && '👨‍🎓'}
                        {roleOpt}
                    </button>
                ))}
            </div>

            {/* Real-time Biometric & Attendance Logs */}
            <div className="section-card" style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginBottom: '15px' }}>⚡ Real-time Biometric & Attendance Logs ({selectedRoleFilter})</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Activity Log Message</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const filteredLogs = activityLogs.filter(log => {
                                    if (selectedRoleFilter === 'All') return true;
                                    const targetRole = roleMapping[selectedRoleFilter];
                                    return log.role === targetRole;
                                });
                                return filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log._id}>
                                            <td><strong>{log.message}</strong></td>
                                            <td style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No attendance activity logs recorded yet for {selectedRoleFilter}.</td>
                                    </tr>
                                );
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeacherAttendance;