import React, { useState, useEffect, useCallback } from 'react';
import { FiUser, FiSearch, FiMail, FiPhone, FiEye, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const TeacherStudents = () => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);

    const fetchSubjects = useCallback(async () => {
        try {
            const res = await api.get('/subjects');
            setSubjects(res.data.data || []);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    }, []);

    const fetchAllStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/students');
            const studentList = res.data.data || [];
            setStudents(studentList.map(s => ({
                _id: s._id,
                rollNumber: s.rollNumber,
                name: `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || 'Unknown',
                email: s.user?.email || '-',
                phone: s.user?.phone || '-',
                department: s.department,
                semester: s.semester,
                section: s.section || 'A',
                attendance: 0, // Will be calculated if needed
                cgpa: 0 // Will be calculated if needed
            })));
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to load students');
            setStudents([]);
        }
        setLoading(false);
    }, []);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const [department, semester, section] = selectedClass.split('-');
            const res = await api.get('/students', {
                params: {
                    department: department.trim(),
                    semester: parseInt(semester),
                    section: section?.trim() || 'A'
                }
            });

            const studentList = res.data.data || [];
            setStudents(studentList.map(s => ({
                _id: s._id,
                rollNumber: s.rollNumber,
                name: `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || 'Unknown',
                email: s.user?.email || '-',
                phone: s.user?.phone || '-',
                department: s.department,
                semester: s.semester,
                section: s.section || 'A',
                attendance: 0,
                cgpa: 0
            })));
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to load students');
            setStudents([]);
        }
        setLoading(false);
    }, [selectedClass]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    useEffect(() => {
        if (selectedClass) {
            fetchStudents();
        } else {
            fetchAllStudents();
        }
    }, [selectedClass, fetchStudents, fetchAllStudents]);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Generate class options
    const classOptions = [...new Set(subjects.map(s => `${s.department}-${s.semester}-A`))];

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading students...</p>
            </div>
        );
    }

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>My Students</h1>
                    <p>View and manage students in your classes</p>
                </div>
            </div>

            {/* Filters */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div style={{ padding: 'var(--spacing-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Search</label>
                        <div style={{ position: 'relative' }}>
                            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name, roll number, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Class</label>
                        <select
                            className="form-select"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">All Classes</option>
                            {classOptions.length > 0 ? (
                                classOptions.map((cls, idx) => (
                                    <option key={idx} value={cls}>{cls.replace(/-/g, ' - Sem ')}</option>
                                ))
                            ) : (
                                <>
                                    <option value="Computer Engineering-5-A">Computer Engineering - Sem 5 - A</option>
                                    <option value="Computer Engineering-5-B">Computer Engineering - Sem 5 - B</option>
                                    <option value="Computer Engineering-3-A">Computer Engineering - Sem 3 - A</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="summary-card">
                    <div className="summary-icon total">
                        <FiUsers />
                    </div>
                    <div className="summary-content">
                        <h3>{filteredStudents.length}</h3>
                        <p>Total Students</p>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="section-card">
                <div className="section-header">
                    <h2><FiUser style={{ marginRight: 8 }} /> Student List</h2>
                </div>
                <div className="table-container">
                    {filteredStudents.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Roll No</th>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Semester</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr key={student._id}>
                                        <td><strong>{student.rollNumber}</strong></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', fontWeight: 600 }}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                {student.name}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiMail size={12} /> {student.email}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}><FiPhone size={12} /> {student.phone}</div>
                                            </div>
                                        </td>
                                        <td>Sem {student.semester} - {student.section}</td>
                                        <td>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => setSelectedStudent(student)}
                                            >
                                                <FiEye /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state" style={{ padding: 'var(--spacing-12)' }}>
                            <FiUsers size={48} />
                            <h3>No Students Found</h3>
                            <p>{selectedClass ? 'No students enrolled in this class.' : 'No students available.'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Student Details Modal */}
            {selectedStudent && (
                <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Student Details</h2>
                            <button className="modal-close" onClick={() => setSelectedStudent(null)}>×</button>
                        </div>
                        <div style={{ padding: 'var(--spacing-6)' }}>
                            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
                                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', fontSize: '2rem', fontWeight: 600, margin: '0 auto var(--spacing-3)' }}>
                                    {selectedStudent.name.charAt(0)}
                                </div>
                                <h3>{selectedStudent.name}</h3>
                                <p style={{ color: 'var(--text-muted)' }}>{selectedStudent.rollNumber}</p>
                            </div>
                            <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                <div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Email</p>
                                    <p>{selectedStudent.email}</p>
                                </div>
                                <div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Phone</p>
                                    <p>{selectedStudent.phone}</p>
                                </div>
                                <div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Department</p>
                                    <p>{selectedStudent.department}</p>
                                </div>
                                <div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Semester</p>
                                    <p>{selectedStudent.semester} - Section {selectedStudent.section}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherStudents;
