import React, { useState, useEffect, useCallback } from 'react';
import { FiCalendar, FiSearch, FiCheckCircle, FiAlertCircle, FiClock, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const SuperAdminShiftAttendance = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [department, setDepartment] = useState('Electrical Engineering');
    const [semester, setSemester] = useState('3');

    const departments = [
        'Computer Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electrical Engineering',
        'Electronics Engineering',
        'Information Technology',
        'Artificial Intelligence and Machine Learning'
    ];

    const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

    // Fetch shift report from API
    const fetchShiftReport = useCallback(async () => {
        try {
            setLoading(true);
            const params = { date };
            if (department) params.department = department;
            if (semester) params.semester = semester;

            const res = await api.get('/attendance2/shift-report', { params });
            if (res.data.success) {
                setReportData(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching shift report:', error);
            toast.error(error.response?.data?.error || 'Failed to load shift attendance report.');
        } finally {
            setLoading(false);
        }
    }, [date, department, semester]);

    // Load initial report on mount
    useEffect(() => {
        fetchShiftReport();
    }, [fetchShiftReport]);

    // Status Badge generator
    const getStatusBadge = (status) => {
        if (status === 'Present') {
            return <span className="badge badge-success" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Present</span>;
        }
        return <span className="badge badge-error" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Absent</span>;
    };

    // Overall Summary Badge generator
    const getSummaryBadge = (summary) => {
        if (summary === 'Fully Present') {
            return <span className="badge badge-success" style={{ fontWeight: 'bold' }}>Fully Present</span>;
        } else if (summary?.startsWith('Partially Present')) {
            return <span className="badge badge-warning" style={{ fontWeight: 'bold' }}>{summary}</span>;
        }
        return <span className="badge badge-error" style={{ fontWeight: 'bold' }}>Absent</span>;
    };

    // Calculate count totals for summary grid
    const totalCount = reportData.length;
    const fullyPresentCount = reportData.filter(d => d.summary === 'Fully Present').length;
    const partiallyPresentCount = reportData.filter(d => d.summary?.startsWith('Partially Present')).length;
    const absentCount = reportData.filter(d => d.summary === 'Absent' || d.summary?.startsWith('Absent')).length;

    return (
        <div className="student-page animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1><FiClock style={{ marginRight: 8 }} /> Double-Validation Shift Attendance</h1>
                    <p>Track student presence across Main Gate IN/OUT validation and 3 daily classroom shifts</p>
                </div>
            </div>

            {/* Filter Search Section */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div style={{ padding: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    
                    {/* Date Picker */}
                    <div>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiCalendar /> Select Date
                        </label>
                        <input
                            type="date"
                            className="form-input"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{ width: '160px' }}
                        />
                    </div>

                    {/* Department Dropdown */}
                    <div>
                        <label className="form-label">Department</label>
                        <select
                            className="form-input"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            style={{ width: '220px' }}
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    {/* Semester Dropdown */}
                    <div>
                        <label className="form-label">Semester</label>
                        <select
                            className="form-input"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            style={{ width: '120px' }}
                        >
                            <option value="">All Semesters</option>
                            {semesters.map(sem => (
                                <option key={sem} value={sem}>Sem {sem}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search Trigger */}
                    <button className="btn btn-primary" onClick={fetchShiftReport} style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiSearch /> Search Report
                    </button>
                </div>
            </div>

            {/* Summary KPI Widgets */}
            <div className="summary-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="summary-card">
                    <div className="summary-icon total">
                        <FiFileText />
                    </div>
                    <div className="summary-content">
                        <h3>{totalCount}</h3>
                        <p>Total Students</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon present">
                        <FiCheckCircle />
                    </div>
                    <div className="summary-content">
                        <h3>{fullyPresentCount}</h3>
                        <p>Fully Present</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon percentage" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <FiClock />
                    </div>
                    <div className="summary-content">
                        <h3>{partiallyPresentCount}</h3>
                        <p>Partially Present</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon absent">
                        <FiAlertCircle />
                    </div>
                    <div className="summary-content">
                        <h3>{absentCount}</h3>
                        <p>Absent</p>
                    </div>
                </div>
            </div>

            {/* Report Table Card */}
            <div className="section-card">
                <div className="table-container">
                    {loading ? (
                        <div className="page-loading"><div className="spinner"></div></div>
                    ) : reportData.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-12)', color: 'var(--text-muted)' }}>
                            <FiAlertCircle size={48} style={{ marginBottom: 'var(--spacing-3)' }} />
                            <h3>No attendance logs found</h3>
                            <p>Verify that you have selected the correct date, department, and semester.</p>
                        </div>
                    ) : (
                        <table className="table" style={{ fontSize: '0.875rem' }}>
                            <thead>
                                <tr>
                                    <th>Student Name (Roll No)</th>
                                    <th>Enroll ID</th>
                                    <th>Gate IN (9:00 - 9:45)</th>
                                    <th>Shift 1 (9:30 - 11:30)</th>
                                    <th>Shift 2 (11:45 - 1:45)</th>
                                    <th>Shift 3 (2:30 - 4:30)</th>
                                    <th>Gate OUT (&gt;= 4:30)</th>
                                    <th>Gate Status</th>
                                    <th>Summary Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((row) => (
                                    <tr key={row.studentId}>
                                        <td>
                                            <strong>{row.firstName} {row.lastName}</strong>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                Roll No: {row.rollNumber}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{row.enrollId || '--'}</td>
                                        
                                        {/* Gate IN cell */}
                                        <td style={{ fontWeight: '500', color: row.gateIn ? '#10b981' : '#ef4444' }}>
                                            {row.gateIn ? `🟢 ${row.gateIn}` : '❌ Missing'}
                                        </td>
                                        
                                        {/* Shift 1 cell */}
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {getStatusBadge(row.shift1.status)}
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {row.shift1.checkIn ? `Time: ${row.shift1.checkIn}` : 'No Check-in'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Shift 2 cell */}
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {getStatusBadge(row.shift2.status)}
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {row.shift2.checkIn ? `Time: ${row.shift2.checkIn}` : 'No Check-in'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Shift 3 cell */}
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {getStatusBadge(row.shift3.status)}
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {row.shift3.checkIn ? `Time: ${row.shift3.checkIn}` : 'No Check-in'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Gate OUT cell */}
                                        <td style={{ fontWeight: '500', color: row.gateOut ? '#10b981' : '#ef4444' }}>
                                            {row.gateOut ? `🟢 ${row.gateOut}` : '❌ Missing'}
                                        </td>

                                        {/* Gate Status Badge */}
                                        <td>
                                            {row.gateIn ? (
                                                row.gateOut ? (
                                                    <span className="badge badge-success" style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Marked</span>
                                                ) : (
                                                    <span className="badge badge-warning" style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Pending</span>
                                                )
                                            ) : (
                                                <span className="badge badge-error" style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Absent</span>
                                            )}
                                        </td>

                                        {/* Final summary status */}
                                        <td>
                                            {getSummaryBadge(row.summary)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminShiftAttendance;
