import React, { useState, useEffect, useCallback } from 'react';
import { FiCalendar, FiClock } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import './StudentPages.css';

const StudentAttendance = () => {
    const { user } = useAuth();
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ daily: '0/5', weekly: 0, monthly: 0, yearly: 0 });

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const [selectedDay, setSelectedDay] = useState(new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()));
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const calculateStats = (logs) => {
        const today = new Date().toDateString();
        const todayLogs = logs.filter(l => new Date(l.time).toDateString() === today);

        // Calculate minutes since midnight
        const getMinutes = (d) => d.getHours() * 60 + d.getMinutes();

        // 1. Gate IN: scan between 9:00 AM and 10:00 AM (540 to 600)
        const gateInLog = todayLogs.find(log => {
            const m = getMinutes(new Date(log.time));
            return m >= 540 && m <= 600;
        });
        const hasGateIn = !!gateInLog;

        // 2. Gate OUT: scan >= 4:30 PM (990)
        const gateOutLog = todayLogs.find(log => {
            const m = getMinutes(new Date(log.time));
            return m >= 990;
        });
        const hasGateOut = !!gateOutLog;

        // 3. Shift 1: scan between 9:30 AM and 11:30 AM (570 to 690)
        const s1Check = todayLogs.find(log => {
            const m = getMinutes(new Date(log.time));
            return m >= 570 && m <= 690;
        });

        // 4. Shift 2: scan between 11:45 AM and 1:45 PM (705 to 825)
        const s2Check = todayLogs.find(log => {
            const m = getMinutes(new Date(log.time));
            return m >= 705 && m <= 825;
        });

        // 5. Shift 3: scan between 2:30 PM and 4:30 PM (870 to 990)
        const s3Check = todayLogs.find(log => {
            const m = getMinutes(new Date(log.time));
            return m >= 870 && m <= 990;
        });

        const hasShift1 = !!s1Check;
        const hasShift2 = !!s2Check;
        const hasShift3 = !!s3Check;

        const dailyCount = (hasGateIn ? 1 : 0) + (hasShift1 ? 1 : 0) + (hasShift2 ? 1 : 0) + (hasShift3 ? 1 : 0) + (hasGateOut ? 1 : 0);
        const dailyDisplay = dailyCount === 5 ? '100%' : `${dailyCount}/5`;

        const todayObj = new Date();

        // Unique days present in the last 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const last7DaysLogs = logs.filter(l => {
            const d = new Date(l.time);
            return d >= oneWeekAgo && d <= todayObj;
        });
        const uniqueWeeklyDays = new Set(last7DaysLogs.map(l => new Date(l.time).toDateString())).size;
        const weeklyPercent = ((uniqueWeeklyDays / 6) * 100).toFixed(1);

        // Unique days present in the last 30 days
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        const last30DaysLogs = logs.filter(l => {
            const d = new Date(l.time);
            return d >= oneMonthAgo && d <= todayObj;
        });
        const uniqueMonthlyDays = new Set(last30DaysLogs.map(l => new Date(l.time).toDateString())).size;
        const monthlyPercent = ((uniqueMonthlyDays / 24) * 100).toFixed(1);

        // Unique days present in the last 365 days
        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 365);
        const last365DaysLogs = logs.filter(l => {
            const d = new Date(l.time);
            return d >= oneYearAgo && d <= todayObj;
        });
        const uniqueYearlyDays = new Set(last365DaysLogs.map(l => new Date(l.time).toDateString())).size;
        const yearlyPercent = ((uniqueYearlyDays / 240) * 100).toFixed(1);

        setStats({
            daily: dailyDisplay,
            weekly: weeklyPercent > 100 ? 100 : weeklyPercent,
            monthly: monthlyPercent > 100 ? 100 : monthlyPercent,
            yearly: yearlyPercent > 100 ? 100 : yearlyPercent
        });
    };

    const fetchMyAttendance = useCallback(async () => {
        try {
            const res = await api.get('/student/my-attendance');
            if (res.data.success) {
                setAttendanceLogs(res.data.data);
                calculateStats(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
        } finally {
            setLoading(false);
        }
    }, []);

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

    useEffect(() => {
        fetchMyAttendance();
        fetchActivityLogs();
        const interval = setInterval(fetchMyAttendance, 5000);

        if (!user) return () => clearInterval(interval);

        const socketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || `http://192.168.1.4:5000`;
        const socket = io(socketUrl);

        socket.on('connect', () => {
            console.log("🔌 Student Attendance Socket Connected");
            socket.emit('register-user', { userId: user.id || user._id, role: user.role });
        });

        socket.on('new-activity-log', (newLog) => {
            setActivityLogs(prev => {
                if (prev.some(log => log._id === newLog._id)) return prev;
                return [newLog, ...prev].slice(0, 50);
            });
            fetchMyAttendance(); // Refresh biometric shifts grid instantly
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [fetchMyAttendance, user]);

    // Get ALL occurrences of the selected weekday in the selected month/year
    const getAllDatesForSelectedDay = () => {
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth) - 1; // 0-indexed
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const targetDayIndex = dayNames.indexOf(selectedDay);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const dates = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            if (date > today) continue; // Skip future dates
            if (date.getDay() === targetDayIndex) {
                dates.push(date.toLocaleDateString());
            }
        }
        return dates;
    };

    // Filter logs based on selection (only for days that have scans)
    const filteredLogs = attendanceLogs.filter(log => {
        const logDate = new Date(log.time);
        const today = new Date();
        if (logDate > today) return false; // Hide future scans
        const matchesDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(logDate) === selectedDay;
        const matchesMonth = (logDate.getMonth() + 1) === parseInt(selectedMonth);
        const matchesYear = logDate.getFullYear() === parseInt(selectedYear);
        return matchesDay && matchesMonth && matchesYear;
    });

    // Group logs by date for check-in and check-out summary
    const getGroupedLogs = (logsList) => {
        const groups = {};
        logsList.forEach(log => {
            const dateStr = new Date(log.time).toLocaleDateString();
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(log);
        });

        const getMinutes = (d) => d.getHours() * 60 + d.getMinutes();

        return Object.keys(groups).map(dateStr => {
            const dayLogs = groups[dateStr].sort((a, b) => new Date(a.time) - new Date(b.time));
            const earliestLog = dayLogs[0];

            // 1. Gate IN: scan between 9:00 AM and 10:00 AM (540 to 600)
            const gateInLog = dayLogs.find(log => {
                const m = getMinutes(new Date(log.time));
                return m >= 540 && m <= 600;
            });
            const gateIn = gateInLog ? new Date(gateInLog.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;

            // 2. Gate OUT: scan >= 4:30 PM (990)
            const gateOutLog = dayLogs.find(log => {
                const m = getMinutes(new Date(log.time));
                return m >= 990;
            });
            const gateOut = gateOutLog ? new Date(gateOutLog.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;

            // 3. Shift 1: scan between 9:30 AM and 11:30 AM (570 to 690)
            const s1Check = dayLogs.find(log => {
                const m = getMinutes(new Date(log.time));
                return m >= 570 && m <= 690;
            });

            // 4. Shift 2: scan between 11:45 AM and 1:45 PM (705 to 825)
            const s2Check = dayLogs.find(log => {
                const m = getMinutes(new Date(log.time));
                return m >= 705 && m <= 825;
            });

            // 5. Shift 3: scan between 2:30 PM and 4:30 PM (870 to 990)
            const s3Check = dayLogs.find(log => {
                const m = getMinutes(new Date(log.time));
                return m >= 870 && m <= 990;
            });

            const hasGateIn = !!gateInLog;
            const hasGateOut = !!gateOutLog;

            const logDateObj = new Date(dayLogs[0].time);
            const isToday = logDateObj.toDateString() === new Date().toDateString();
            const currentMinutes = getMinutes(new Date());

            const computeShiftStatus = (classCheck) => {
                const checkInTime = classCheck ? new Date(classCheck.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
                const hasClassCheck = !!classCheck;

                let status = 'Absent';
                if (isToday) {
                    if (currentMinutes < 990) { // Before 4:30 PM today
                        status = (hasGateIn && hasClassCheck) ? 'Present' : 'Absent';
                    } else { // After 4:30 PM today
                        status = (hasGateIn && hasClassCheck && hasGateOut) ? 'Present' : 'Absent';
                    }
                } else { // Past date
                    status = (hasGateIn && hasClassCheck && hasGateOut) ? 'Present' : 'Absent';
                }

                return { checkIn: checkInTime, status };
            };

            const shift1 = computeShiftStatus(s1Check);
            const shift2 = computeShiftStatus(s2Check);
            const shift3 = computeShiftStatus(s3Check);

            // Gate status
            let gateStatus = 'Absent';
            if (hasGateIn) {
                gateStatus = hasGateOut ? 'Marked' : 'Pending';
            }

            // Summary Status
            const presentShifts = [shift1.status, shift2.status, shift3.status].filter(s => s === 'Present').length;
            let summary = 'Absent';
            if (presentShifts === 3) {
                summary = 'Fully Present';
            } else if (presentShifts > 0) {
                summary = `Partially Present (${presentShifts}/3)`;
            }

            return {
                date: dateStr,
                gateIn,
                gateOut,
                shift1,
                shift2,
                shift3,
                gateStatus,
                summary,
                _id: earliestLog._id
            };
        });
    };

    // Merge: for every weekday occurrence in the month, if no scan exists → add Absent row
    const absentRowTemplate = {
        gateIn: null,
        gateOut: null,
        shift1: { checkIn: null, status: 'Absent' },
        shift2: { checkIn: null, status: 'Absent' },
        shift3: { checkIn: null, status: 'Absent' },
        gateStatus: 'Absent',
        summary: 'Absent'
    };

    const groupedWithPresent = getGroupedLogs(filteredLogs);
    const presentDateSet = new Set(groupedWithPresent.map(g => g.date));
    const allDatesForDay = getAllDatesForSelectedDay();

    const absentRows = allDatesForDay
        .filter(dateStr => !presentDateSet.has(dateStr))
        .map(dateStr => ({ ...absentRowTemplate, date: dateStr, _id: `absent-${dateStr}` }));

    // Merge and sort descending by date
    const groupedFilteredLogs = [...groupedWithPresent, ...absentRows]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="student-page animate-fade-in">
            {/* Header Section */}
            <div className="page-header">
                <div>
                    <h1><FiCalendar style={{ marginRight: 8 }} /> Student Biometric Dashboard</h1>
                    <p>Real-time Biometric Attendance Analysis</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                <div className="summary-card" style={{ borderLeft: '4px solid #38bdf8' }}>
                    <h3 style={{ color: '#38bdf8' }}>{stats.daily}</h3>
                    <p>Daily Attendance</p>
                </div>
                <div className="summary-card" style={{ borderLeft: '4px solid #22c55e' }}>
                    <h3 style={{ color: '#22c55e' }}>{stats.weekly}%</h3>
                    <p>Weekly Attendance</p>
                </div>
                <div className="summary-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <h3 style={{ color: '#f59e0b' }}>{stats.monthly}%</h3>
                    <p>Monthly Attendance</p>
                </div>
                <div className="summary-card" style={{ borderLeft: '4px solid #a855f7' }}>
                    <h3 style={{ color: '#a855f7' }}>{stats.yearly}%</h3>
                    <p>Yearly Attendance</p>
                </div>
            </div>

            {/* Date Filters Section */}
            <div className="section-card" style={{ marginBottom: '20px', padding: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <FiCalendar />
                    {days.map(d => (
                        <button key={d}
                            className={`btn btn-sm ${selectedDay === d ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setSelectedDay(d)}
                        >
                            {d}
                        </button>
                    ))}

                    {/* Month Selector */}
                    <select
                        className="form-select"
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-main)', fontWeight: '500' }}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                    </select>

                    {/* Year Selector */}
                    <select
                        className="form-select"
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-main)', fontWeight: '500' }}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </div>

            {/* Attendance Logs Table */}
            <div className="section-card">
                <div className="card-header" style={{ marginBottom: '15px' }}>
                    <h2><FiClock /> Attendance Logs — {selectedDay} &bull; {new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleString('en-US', { month: 'long' })} {selectedYear}</h2>
                </div>
                <div className="table-container">
                    {loading ? (
                        <div className="page-loading"><div className="spinner"></div></div>
                    ) : (
                        <table className="table" style={{ fontSize: '0.875rem' }}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Gate IN (9:00 - 10:00)</th>
                                    <th>Shift 1 (9:30 - 11:30)</th>
                                    <th>Shift 2 (11:45 - 1:45)</th>
                                    <th>Shift 3 (2:30 - 4:30)</th>
                                    <th>Gate OUT (&gt;= 4:30)</th>
                                    <th>Gate Status</th>
                                    <th>Summary Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedFilteredLogs.length > 0 ? (
                                    groupedFilteredLogs.map((log) => (
                                        <tr key={log._id}>
                                            <td><strong>{log.date}</strong></td>

                                            {/* Gate IN check */}
                                            <td style={{ fontWeight: '500', color: log.gateIn ? '#10b981' : '#ef4444' }}>
                                                {log.gateIn ? `🟢 ${log.gateIn}` : '❌ Missing'}
                                            </td>

                                            {/* Shift 1 check */}
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {log.shift1.status === 'Present' ? (
                                                        <span className="badge badge-success" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Present</span>
                                                    ) : (
                                                        <span className="badge badge-error" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Absent</span>
                                                    )}
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {log.shift1.checkIn ? `Time: ${log.shift1.checkIn}` : 'No Check-in'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Shift 2 check */}
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {log.shift2.status === 'Present' ? (
                                                        <span className="badge badge-success" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Present</span>
                                                    ) : (
                                                        <span className="badge badge-error" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Absent</span>
                                                    )}
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {log.shift2.checkIn ? `Time: ${log.shift2.checkIn}` : 'No Check-in'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Shift 3 check */}
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {log.shift3.status === 'Present' ? (
                                                        <span className="badge badge-success" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Present</span>
                                                    ) : (
                                                        <span className="badge badge-error" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Absent</span>
                                                    )}
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {log.shift3.checkIn ? `Time: ${log.shift3.checkIn}` : 'No Check-in'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Gate OUT check */}
                                            <td style={{ fontWeight: '500', color: log.gateOut ? '#10b981' : '#ef4444' }}>
                                                {log.gateOut ? `🟢 ${log.gateOut}` : '❌ Missing'}
                                            </td>

                                            {/* Gate Status badge */}
                                            <td>
                                                {log.gateStatus === 'Marked' ? (
                                                    <span className="badge badge-success" style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Marked</span>
                                                ) : log.gateStatus === 'Pending' ? (
                                                    <span className="badge badge-warning" style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Pending</span>
                                                ) : (
                                                    <span className="badge badge-error" style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Absent</span>
                                                )}
                                            </td>

                                            {/* Summary status badge */}
                                            <td>
                                                {log.summary === 'Fully Present' ? (
                                                    <span className="badge badge-success" style={{ fontWeight: 'bold' }}>Fully Present</span>
                                                ) : log.summary?.startsWith('Partially Present') ? (
                                                    <span className="badge badge-warning" style={{ fontWeight: 'bold' }}>{log.summary}</span>
                                                ) : (
                                                    <span className="badge badge-error" style={{ fontWeight: 'bold' }}>Absent</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--text-muted)' }}>
                                            {selectedDay === 'Sunday' ? '✨ Sunday - Weekly Academic Holiday' : `No biometric scans recorded on ${selectedDay} in ${new Date(selectedYear, parseInt(selectedMonth) - 1).toLocaleString('en-US', { month: 'long' })} ${selectedYear}.`}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Real-time Biometric & Attendance Logs */}
            <div className="section-card" style={{ marginTop: '30px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginBottom: '15px' }}>⚡ Real-time Biometric & Attendance Logs</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Activity Log Message</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activityLogs.length > 0 ? (
                                activityLogs.map((log) => (
                                    <tr key={log._id}>
                                        <td><strong>{log.message}</strong></td>
                                        <td style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No attendance activity logs recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;