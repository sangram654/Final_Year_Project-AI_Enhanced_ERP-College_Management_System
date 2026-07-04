import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';

const SuperAdminAttendancePage = () => {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');

    const roleMapping = {
        'Super Admin': 'super_admin',
        'Admin': 'admin',
        'Teacher': 'teacher',
        'Student': 'student'
    };

    useEffect(() => {
        fetchAttendance();
        fetchActivityLogs();
    }, []);

    useEffect(() => {
        if (!user) return;

        const socketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || `http://192.168.1.4:5000`;
        const socket = io(socketUrl);

        socket.on('connect', () => {
            console.log("🔌 Super Admin Attendance Socket Connected");
            socket.emit('register-user', { userId: user.id || user._id, role: user.role });
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

    const fetchAttendance = async () => {
        try {
            const res = await api.get('/attendance/all');
            if (res.data.success) {
                setAttendance(res.data.data);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const fetchActivityLogs = async () => {
        try {
            const res = await api.get('/activity-logs');
            if (res.data.success) {
                setActivityLogs(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching activity logs:", err);
        }
    };

    if (loading) return <p>Loading...</p>;

    const filteredLogs = activityLogs.filter(log => {
        if (selectedRoleFilter === 'All') return true;
        const targetRole = roleMapping[selectedRoleFilter];
        return log.role === targetRole;
    });

    return (
        <div className="student-page">
            <h2>🛡️ Super Admin Attendance Control</h2>

            {/* Role-wise Attendance Sub-Navbar */}
            <div className="sub-navbar" style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '25px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px',
                flexWrap: 'wrap'
            }}>
                {['All', 'Super Admin', 'Admin', 'Teacher', 'Student'].map((roleOpt) => (
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
                        {roleOpt === 'Super Admin' && '🛡️'}
                        {roleOpt === 'Admin' && '⚙️'}
                        {roleOpt === 'Teacher' && '👨‍🏫'}
                        {roleOpt === 'Student' && '👨‍🎓'}
                        {roleOpt}
                    </button>
                ))}
            </div>

            {(selectedRoleFilter === 'All' || selectedRoleFilter === 'Student') && (
                <div className="table-container" style={{ marginBottom: '30px' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Mode</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.length > 0 ? (
                                attendance.map((a) => (
                                    <tr key={a._id}>
                                        <td>
                                            {a.student?.user?.firstName} {a.student?.user?.lastName}
                                        </td>
                                        <td>{a.status}</td>
                                        <td>{a.verificationMode || 'Manual'}</td>
                                        <td>{new Date(a.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No student attendance records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Real-time Biometric & Attendance Logs */}
            <div className="section-card" style={{ marginTop: '30px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
                            {filteredLogs.length > 0 ? (
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
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminAttendancePage;