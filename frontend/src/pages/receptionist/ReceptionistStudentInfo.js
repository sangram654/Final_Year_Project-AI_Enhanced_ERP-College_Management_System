import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiSearch, FiPhone, FiMail, FiBook, FiUser } from 'react-icons/fi';
import api from '../../services/api';
import '../student/StudentPages.css';

const ReceptionistStudentInfo = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const fetchStudents = useCallback(async () => {
        if (!searchTerm.trim()) {
            setStudents([]);
            return;
        }

        setLoading(true);
        try {
            const params = { search: searchTerm, limit: 20 };
            const res = await api.get('/students', { params });
            if (res.data.success) {
                setStudents(res.data.data || []);
            }
        } catch (error) {
            console.error('Error:', error);
            setStudents([]);
        }
        setLoading(false);
    }, [searchTerm]);

    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            fetchStudents();
        }, 500);
        return () => clearTimeout(delayedSearch);
    }, [fetchStudents]);

    const handleViewDetails = (student) => {
        setSelectedStudent(student);
        setShowDetails(true);
    };

    const getFeeStatusColor = (status) => {
        switch(status?.toLowerCase()) {
            case 'paid': return { bg: '#e8f5e9', color: '#2e7d32' };
            case 'pending': return { bg: '#fff3e0', color: '#e65100' };
            case 'overdue': return { bg: '#ffebee', color: '#c62828' };
            default: return { bg: '#e3f2fd', color: '#1565c0' };
        }
    };

    const getAttendanceColor = (percentage) => {
        if (percentage >= 75) return '#27ae60';
        if (percentage >= 60) return '#f39c12';
        return '#e74c3c';
    };

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1><FiUsers style={{ marginRight: 8 }} /> Student Information</h1>
                    <p>Search and view student details for assistance</p>
                </div>
            </div>

            {/* Search Section */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-4)' }}>
                <div style={{ padding: 'var(--spacing-4)' }}>
                    <div className="input-icon-wrapper" style={{ maxWidth: 400 }}>
                        <FiSearch className="input-icon" />
                        <input
                            type="text"
                            className="form-input with-icon"
                            placeholder="Search by name, roll number, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {searchTerm.trim() && (
                        <p style={{ marginTop: 'var(--spacing-2)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {loading ? 'Searching...' : `Found ${students.length} student(s)`}
                        </p>
                    )}
                </div>
            </div>

            {/* Results */}
            {searchTerm.trim() && (
                <div className="section-card">
                    <div className="section-header">
                        <h2>Search Results</h2>
                    </div>

                    {loading ? (
                        <div style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name & Roll No.</th>
                                        <th>Department</th>
                                        <th>Contact</th>
                                        <th>Fee Status</th>
                                        <th>Attendance</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => {
                                        const feeStatusColor = getFeeStatusColor(student.feeStatus);
                                        const attendanceColor = getAttendanceColor(student.attendancePercentage);
                                        return (
                                            <tr key={student._id}>
                                                <td>
                                                    <div>
                                                        <strong>{student.user?.firstName} {student.user?.lastName}</strong>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            {student.rollNumber}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div>{student.department}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            {student.semester} - {student.year}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        <div><FiPhone size={12} /> {student.user?.phone}</div>
                                                        <div><FiMail size={12} /> {student.user?.email}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '3px 12px',
                                                        borderRadius: 12,
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        background: feeStatusColor.bg,
                                                        color: feeStatusColor.color,
                                                    }}>
                                                        {student.feeStatus}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontWeight: 600,
                                                        color: attendanceColor
                                                    }}>
                                                        {student.attendancePercentage}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleViewDetails(student)}
                                                        className="btn btn-primary"
                                                        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>
                                                {searchTerm.length < 3 ? 'Enter at least 3 characters to search' : 'No students found'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Student Details Modal */}
            {showDetails && selectedStudent && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflow: 'auto'
                }}>
                    <div style={{
                        background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)',
                        padding: 'var(--spacing-6)', width: '100%', maxWidth: 700, maxHeight: '90vh',
                        overflow: 'auto', boxShadow: 'var(--shadow-xl)', margin: 'var(--spacing-4)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                            <h2>Student Details</h2>
                            <button className="btn btn-secondary" onClick={() => setShowDetails(false)}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                            {/* Personal Information */}
                            <div className="section-card" style={{ margin: 0 }}>
                                <div className="section-header" style={{ padding: 'var(--spacing-4) var(--spacing-4) 0' }}>
                                    <h3><FiUser style={{ marginRight: 8 }} /> Personal Information</h3>
                                </div>
                                <div style={{ padding: 'var(--spacing-4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                                    <div>
                                        <strong>Name:</strong>
                                        <div>{selectedStudent.user?.firstName} {selectedStudent.user?.lastName}</div>
                                    </div>
                                    <div>
                                        <strong>Roll Number:</strong>
                                        <div>{selectedStudent.rollNumber}</div>
                                    </div>
                                    <div>
                                        <strong>Email:</strong>
                                        <div>{selectedStudent.user?.email}</div>
                                    </div>
                                    <div>
                                        <strong>Phone:</strong>
                                        <div>{selectedStudent.user?.phone}</div>
                                    </div>
                                    <div>
                                        <strong>Address:</strong>
                                        <div>{selectedStudent.currentAddress}</div>
                                    </div>
                                    <div>
                                        <strong>Admission Date:</strong>
                                        <div>{new Date(selectedStudent.admissionDate).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Academic Information */}
                            <div className="section-card" style={{ margin: 0 }}>
                                <div className="section-header" style={{ padding: 'var(--spacing-4) var(--spacing-4) 0' }}>
                                    <h3><FiBook style={{ marginRight: 8 }} /> Academic Information</h3>
                                </div>
                                <div style={{ padding: 'var(--spacing-4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                                    <div>
                                        <strong>Department:</strong>
                                        <div>{selectedStudent.department}</div>
                                    </div>
                                    <div>
                                        <strong>Current Semester:</strong>
                                        <div>{selectedStudent.semester}</div>
                                    </div>
                                    <div>
                                        <strong>Year:</strong>
                                        <div>{selectedStudent.year}</div>
                                    </div>
                                    <div>
                                        <strong>Attendance:</strong>
                                        <div style={{ color: getAttendanceColor(selectedStudent.attendancePercentage), fontWeight: 600 }}>
                                            {selectedStudent.attendancePercentage}%
                                        </div>
                                    </div>
                                    <div>
                                        <strong>Fee Status:</strong>
                                        <span style={{
                                            padding: '3px 12px',
                                            borderRadius: 12,
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            ...getFeeStatusColor(selectedStudent.feeStatus),
                                        }}>
                                            {selectedStudent.feeStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            {selectedStudent.emergencyContact && (
                                <div className="section-card" style={{ margin: 0 }}>
                                    <div className="section-header" style={{ padding: 'var(--spacing-4) var(--spacing-4) 0' }}>
                                        <h3><FiPhone style={{ marginRight: 8 }} /> Emergency Contact</h3>
                                    </div>
                                    <div style={{ padding: 'var(--spacing-4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                                        <div>
                                            <strong>Name:</strong>
                                            <div>{selectedStudent.emergencyContact.name}</div>
                                        </div>
                                        <div>
                                            <strong>Relation:</strong>
                                            <div>{selectedStudent.emergencyContact.relation}</div>
                                        </div>
                                        <div>
                                            <strong>Phone:</strong>
                                            <div>{selectedStudent.emergencyContact.phone}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
                            <button className="btn btn-primary" onClick={() => setShowDetails(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Helper Text */}
            {!searchTerm.trim() && (
                <div className="section-card">
                    <div style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
                        <FiUsers size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-3)' }} />
                        <h3 style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-2)' }}>
                            Student Search
                        </h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Enter a student's name, roll number, or email to search and view their details.
                            <br />
                            This helps you quickly assist students and parents with inquiries.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceptionistStudentInfo;