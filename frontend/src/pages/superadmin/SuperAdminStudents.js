import React, { useState, useEffect } from 'react';
import { FiUser, FiSearch, FiPlus, FiEdit2, FiTrash2, FiMail, FiPhone, FiCopy } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const SuperAdminStudents = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [editingStudent, setEditingStudent] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        rollNumber: '',
        department: '',
        course: '',
        semester: 1,
        section: 'A',
        batch: new Date().getFullYear().toString(),
        dateOfBirth: '',
        gender: '',
        category: 'General',
        bloodGroup: ''
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/students');
            setStudents(res.data.data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to fetch students');
            setStudents([]);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingStudent) {
                // Update existing student
                const res = await api.put(`/students/${editingStudent._id}`, formData);
                if (res.data.success) {
                    toast.success('Student updated successfully!');
                    fetchStudents();
                }
            } else {
                // Create new student via API
                const res = await api.post('/students', formData);
                if (res.data.success) {
                    toast.success('Student added successfully!');
                    fetchStudents();

                    // Show credentials modal
                    if (res.data.credentials) {
                        setCredentials(res.data.credentials);
                        setShowCredentials(true);
                    }
                }
            }
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.response?.data?.message || 'Operation failed');
        }
        setSubmitting(false);
    };

    const handleDelete = async (studentId) => {
        if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            try {
                await api.delete(`/students/${studentId}`);
                toast.success('Student deleted successfully');
                fetchStudents();
            } catch (error) {
                console.error('Error deleting student:', error);
                toast.error(error.response?.data?.message || 'Failed to delete student');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            rollNumber: '',
            department: '',
            course: '',
            semester: 1,
            section: 'A',
            batch: new Date().getFullYear().toString(),
            dateOfBirth: '',
            gender: '',
            category: 'General',
            bloodGroup: ''
        });
        setEditingStudent(null);
    };

    const openEditModal = (student) => {
        setEditingStudent(student);
        setFormData({
            firstName: student.user?.firstName || '',
            lastName: student.user?.lastName || '',
            email: student.user?.email || '',
            phone: student.user?.phone || '',
            rollNumber: student.rollNumber || '',
            department: student.department || '',
            course: student.course || '',
            semester: student.semester || 1,
            section: student.section || 'A',
            batch: student.batch || '',
            dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
            gender: student.gender || '',
            category: student.category || 'General',
            bloodGroup: student.bloodGroup || ''
        });
        setShowModal(true);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const filteredStudents = students.filter(student => {
        const name = `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.toLowerCase();
        const matchesSearch = name.includes(searchQuery.toLowerCase()) ||
            student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = !selectedDepartment || student.department === selectedDepartment;
        return matchesSearch && matchesDept;
    });

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
                    <h1>Manage Students</h1>
                    <p>Add, edit, and manage student records</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <FiPlus /> Add Student
                </button>
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
                                placeholder="Search by name, roll no, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Department</label>
                        <select className="form-select" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                            <option value="">All Departments</option>
                            <option value="Computer Engineering">Computer Engineering</option>
                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                            <option value="Civil Engineering">Civil Engineering</option>
                            <option value="Electrical Engineering">Electrical Engineering</option>
                            <option value="Electronics Engineering">Electronics Engineering</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="summary-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="summary-card">
                    <div className="summary-icon total">
                        <FiUser />
                    </div>
                    <div className="summary-content">
                        <h3>{students.length}</h3>
                        <p>Total Students</p>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="section-card">
                <div className="section-header">
                    <h2>Student List ({filteredStudents.length})</h2>
                </div>
                <div className="table-container">
                    {filteredStudents.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Roll No</th>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Department</th>
                                    <th>Semester</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr key={student._id}>
                                        <td><strong>{student.rollNumber}</strong></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', fontWeight: 600 }}>
                                                    {student.user?.firstName?.charAt(0) || 'S'}
                                                </div>
                                                {student.user?.firstName} {student.user?.lastName}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiMail size={12} /> {student.user?.email}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}><FiPhone size={12} /> {student.user?.phone || '-'}</div>
                                            </div>
                                        </td>
                                        <td>{student.department}</td>
                                        <td>Sem {student.semester} - {student.section || 'A'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(student)}>
                                                    <FiEdit2 /> Edit
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleDelete(student._id)}
                                                    style={{ color: 'var(--error-color)' }}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state" style={{ padding: 'var(--spacing-12)' }}>
                            <FiUser size={48} />
                            <h3>No Students Found</h3>
                            <p>Add your first student by clicking the "Add Student" button above.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2>{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: 'var(--spacing-4)' }}>
                                {/* Personal Information */}
                                <h3 style={{ marginBottom: 'var(--spacing-4)', color: 'var(--primary-500)' }}>Personal Information</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">First Name *</label>
                                        <input type="text" className="form-input" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Last Name *</label>
                                        <input type="text" className="form-input" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={editingStudent} />
                                        {editingStudent && <small style={{ color: 'var(--text-muted)' }}>Email cannot be changed</small>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input type="tel" className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Date of Birth</label>
                                        <input type="date" className="form-input" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Gender *</label>
                                        <select className="form-select" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} required>
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Blood Group</label>
                                        <select className="form-select" value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                                            <option value="">Select</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Academic Information */}
                                <h3 style={{ marginTop: 'var(--spacing-6)', marginBottom: 'var(--spacing-4)', color: 'var(--primary-500)' }}>Academic Information</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Roll Number *</label>
                                        <input type="text" className="form-input" value={formData.rollNumber} onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })} required placeholder="e.g., CE2024001" disabled={editingStudent} />
                                        {!editingStudent && <small style={{ color: 'var(--text-muted)' }}>Password will be: RollNumber@123</small>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Batch/Year *</label>
                                        <input type="text" className="form-input" value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} required placeholder="e.g., 2024" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Department *</label>
                                        <select className="form-select" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required>
                                            <option value="">Select Department</option>
                                            <option value="Computer Engineering">Computer Engineering</option>
                                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                                            <option value="Civil Engineering">Civil Engineering</option>
                                            <option value="Electrical Engineering">Electrical Engineering</option>
                                            <option value="Electronics Engineering">Electronics Engineering</option>
                                            <option value="Information Technology">Information Technology</option>
                                            <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Course</label>
                                        <select className="form-select" value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })}>
                                            <option value="">Select Course</option>
                                            <option value="B.E.">B.E.</option>
                                            <option value="B.Tech">B.Tech</option>
                                            <option value="M.E.">M.E.</option>
                                            <option value="M.Tech">M.Tech</option>
                                            <option value="Diploma">Diploma</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Semester *</label>
                                        <select className="form-select" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })} required>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Section</label>
                                        <select className="form-select" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })}>
                                            <option value="A">Section A</option>
                                            <option value="B">Section B</option>
                                            <option value="C">Section C</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select className="form-select" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                            <option value="General">General</option>
                                            <option value="OBC">OBC</option>
                                            <option value="SC">SC</option>
                                            <option value="ST">ST</option>
                                            <option value="EWS">EWS</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editingStudent ? 'Update' : 'Add')} Student
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Credentials Modal */}
            {showCredentials && credentials && (
                <div className="modal-overlay" onClick={() => setShowCredentials(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header" style={{ background: 'var(--success)', color: 'white' }}>
                            <h2>✓ Student Created Successfully!</h2>
                            <button className="modal-close" onClick={() => setShowCredentials(false)} style={{ color: 'white' }}>×</button>
                        </div>
                        <div style={{ padding: 'var(--spacing-6)' }}>
                            <p style={{ marginBottom: 'var(--spacing-4)', color: 'var(--text-secondary)' }}>
                                Please share the following login credentials with the student:
                            </p>
                            <div style={{ background: 'var(--bg-secondary)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-4)' }}>
                                <div style={{ marginBottom: 'var(--spacing-3)' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Email</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem', flex: 1 }}>{credentials.email}</div>
                                        <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(credentials.email)}>
                                            <FiCopy />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Password</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem', fontFamily: 'monospace', background: 'white', padding: 'var(--spacing-2) var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', flex: 1 }}>
                                            {credentials.password}
                                        </div>
                                        <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(credentials.password)}>
                                            <FiCopy />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--warning)', marginBottom: 'var(--spacing-4)' }}>
                                ⚠️ {credentials.note}
                            </p>
                            <button className="btn btn-primary" onClick={() => setShowCredentials(false)} style={{ width: '100%' }}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminStudents;
