import React, { useState, useEffect } from 'react';
import { FiUser, FiSearch, FiPlus, FiEdit2, FiTrash2, FiMail, FiPhone, FiCopy } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const SuperAdminTeachers = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        employeeId: '',
        department: '',
        designation: '',
        qualification: '',
        specialization: '',
        experience: '',
        joiningDate: '',
        gender: '',
        salary: ''
    });

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/teachers');
            setTeachers(res.data.data || []);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            toast.error('Failed to fetch teachers');
            setTeachers([]);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingTeacher) {
                // Update existing teacher
                const res = await api.put(`/teachers/${editingTeacher._id}`, formData);
                if (res.data.success) {
                    toast.success('Teacher updated successfully!');
                    fetchTeachers();
                }
            } else {
                // Create new teacher via API
                const res = await api.post('/teachers', formData);
                if (res.data.success) {
                    toast.success('Teacher added successfully!');
                    fetchTeachers();

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

    const handleDelete = async (teacherId) => {
        if (window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
            try {
                await api.delete(`/teachers/${teacherId}`);
                toast.success('Teacher deleted successfully');
                fetchTeachers();
            } catch (error) {
                console.error('Error deleting teacher:', error);
                toast.error(error.response?.data?.message || 'Failed to delete teacher');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            employeeId: '',
            department: '',
            designation: '',
            qualification: '',
            specialization: '',
            experience: '',
            joiningDate: '',
            gender: '',
            salary: ''
        });
        setEditingTeacher(null);
    };

    const openEditModal = (teacher) => {
        setEditingTeacher(teacher);
        setFormData({
            firstName: teacher.user?.firstName || '',
            lastName: teacher.user?.lastName || '',
            email: teacher.user?.email || '',
            phone: teacher.user?.phone || '',
            employeeId: teacher.employeeId || '',
            department: teacher.department || '',
            designation: teacher.designation || '',
            qualification: teacher.qualification || '',
            specialization: teacher.specialization || '',
            experience: teacher.experience || '',
            joiningDate: teacher.joiningDate ? teacher.joiningDate.split('T')[0] : '',
            gender: teacher.gender || '',
            salary: teacher.salary || ''
        });
        setShowModal(true);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const filteredTeachers = teachers.filter(teacher => {
        const name = `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''}`.toLowerCase();
        const matchesSearch = name.includes(searchQuery.toLowerCase()) ||
            teacher.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            teacher.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = !selectedDepartment || teacher.department === selectedDepartment;
        return matchesSearch && matchesDept;
    });

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading teachers...</p>
            </div>
        );
    }

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Manage Teachers</h1>
                    <p>Add, edit, and manage faculty records</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <FiPlus /> Add Teacher
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
                                placeholder="Search by name, ID, or email..."
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
                    <div className="summary-icon total" style={{ background: 'var(--secondary-light)', color: 'var(--secondary-color)' }}>
                        <FiUser />
                    </div>
                    <div className="summary-content">
                        <h3>{teachers.length}</h3>
                        <p>Total Teachers</p>
                    </div>
                </div>
            </div>

            {/* Teachers Table */}
            <div className="section-card">
                <div className="section-header">
                    <h2>Faculty List ({filteredTeachers.length})</h2>
                </div>
                <div className="table-container">
                    {filteredTeachers.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Department</th>
                                    <th>Designation</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTeachers.map((teacher) => (
                                    <tr key={teacher._id}>
                                        <td><strong>{teacher.employeeId}</strong></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-color)', fontWeight: 600 }}>
                                                    {teacher.user?.firstName?.charAt(0) || 'T'}
                                                </div>
                                                <div>
                                                    {teacher.user?.firstName} {teacher.user?.lastName}
                                                    <br />
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{teacher.qualification}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiMail size={12} /> {teacher.user?.email}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}><FiPhone size={12} /> {teacher.user?.phone || '-'}</div>
                                            </div>
                                        </td>
                                        <td>{teacher.department}</td>
                                        <td><span className="badge badge-info">{teacher.designation}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(teacher)}>
                                                    <FiEdit2 /> Edit
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleDelete(teacher._id)}
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
                            <h3>No Teachers Found</h3>
                            <p>Add your first teacher by clicking the "Add Teacher" button above.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: 'var(--spacing-4)' }}>
                                {/* Personal Information */}
                                <h3 style={{ marginBottom: 'var(--spacing-4)', color: 'var(--secondary-500)' }}>Personal Information</h3>
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
                                        <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={editingTeacher} />
                                        {editingTeacher && <small style={{ color: 'var(--text-muted)' }}>Email cannot be changed</small>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input type="tel" className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
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
                                        <label className="form-label">Employee ID *</label>
                                        <input type="text" className="form-input" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} required placeholder="e.g., TCH001" disabled={editingTeacher} />
                                        {!editingTeacher && <small style={{ color: 'var(--text-muted)' }}>Password will be: EmployeeID@123</small>}
                                    </div>
                                </div>

                                {/* Professional Information */}
                                <h3 style={{ marginTop: 'var(--spacing-6)', marginBottom: 'var(--spacing-4)', color: 'var(--secondary-500)' }}>Professional Information</h3>
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
                                        <label className="form-label">Designation *</label>
                                        <select className="form-select" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} required>
                                            <option value="">Select Designation</option>
                                            <option value="Professor">Professor</option>
                                            <option value="Associate Professor">Associate Professor</option>
                                            <option value="Assistant Professor">Assistant Professor</option>
                                            <option value="Lecturer">Lecturer</option>
                                            <option value="Lab Assistant">Lab Assistant</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Qualification *</label>
                                        <input type="text" className="form-input" value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} required placeholder="e.g., Ph.D, M.Tech, M.E." />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Specialization</label>
                                        <input type="text" className="form-input" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="e.g., Machine Learning, Data Structures" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Experience (Years)</label>
                                        <input type="number" className="form-input" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} min="0" placeholder="e.g., 5" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Joining Date</label>
                                        <input type="date" className="form-input" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Salary (₹)</label>
                                        <input type="number" className="form-input" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} min="0" placeholder="e.g., 50000" />
                                    </div>
                                </div>
                            </div>
                            <div className="form-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editingTeacher ? 'Update' : 'Add')} Teacher
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
                            <h2>✓ Teacher Created Successfully!</h2>
                            <button className="modal-close" onClick={() => setShowCredentials(false)} style={{ color: 'white' }}>×</button>
                        </div>
                        <div style={{ padding: 'var(--spacing-6)' }}>
                            <p style={{ marginBottom: 'var(--spacing-4)', color: 'var(--text-secondary)' }}>
                                Please share the following login credentials with the teacher:
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

export default SuperAdminTeachers;
