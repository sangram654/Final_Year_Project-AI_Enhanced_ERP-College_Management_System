import React, { useState, useEffect } from 'react';
import { FiBook, FiSearch, FiPlus, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const AdminSubjects = () => {
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [formData, setFormData] = useState({
        subjectCode: '', name: '', department: '', semester: 1, credits: 3, maxMarks: 100, teacher: ''
    });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/subjects');
            setSubjects(res.data.data || []);
        } catch (error) {
            console.error('Error fetching subjects:', error);
            setSubjects([]);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                code: formData.subjectCode.trim().toUpperCase(),
                name: formData.name.trim(),
                department: formData.department,
                semester: Number(formData.semester),
                credits: Number(formData.credits),
            };

            if (formData.teacher && formData.teacher.trim() !== '') {
                payload.teacher = formData.teacher.trim();
            }

            if (editingSubject) {
                const res = await api.put(`/subjects/${editingSubject._id}`, payload);
                if (res.data.success) {
                    toast.success('Subject updated successfully!');
                    fetchSubjects();
                }
            } else {
                const res = await api.post('/subjects', payload);
                if (res.data.success) {
                    toast.success('Subject added successfully!');
                    fetchSubjects();
                }
            }
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Subject operation failed:', error);
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (subjectId) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            try {
                const res = await api.delete(`/subjects/${subjectId}`);
                if (res.data.success) {
                    toast.success('Subject deleted successfully');
                    fetchSubjects();
                }
            } catch (error) {
                console.error('Delete failed:', error);
                toast.error(error.response?.data?.message || 'Failed to delete subject');
            }
        }
    };

    const resetForm = () => {
        setFormData({ subjectCode: '', name: '', department: '', semester: 1, credits: 3, maxMarks: 100, teacher: '' });
        setEditingSubject(null);
    };

    const openEditModal = (subject) => {
        setEditingSubject(subject);
        setFormData({
            subjectCode: subject.code || subject.subjectCode || '',
            name: subject.name,
            department: subject.department,
            semester: subject.semester,
            credits: subject.credits,
            maxMarks: subject.maxMarks,
            teacher: ''
        });
        setShowModal(true);
    };

    const filteredSubjects = subjects.filter(subject => {
        const subjectCode = subject.code || subject.subjectCode || '';
        const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subjectCode.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = !selectedDepartment || subject.department === selectedDepartment;
        return matchesSearch && matchesDept;
    });

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading subjects...</p>
            </div>
        );
    }

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Manage Subjects</h1>
                    <p>Add and manage course subjects</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <FiPlus /> Add Subject
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
                                placeholder="Search by name or code..."
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
                        <FiBook />
                    </div>
                    <div className="summary-content">
                        <h3>{subjects.length}</h3>
                        <p>Total Subjects</p>
                    </div>
                </div>
            </div>

            {/* Subjects Table */}
            <div className="section-card">
                <div className="section-header">
                    <h2>Subject List ({filteredSubjects.length})</h2>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Subject Name</th>
                                <th>Department</th>
                                <th>Semester</th>
                                <th>Credits</th>
                                <th>Assigned Teacher</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubjects.map((subject) => (
                                <tr key={subject._id}>
                                    <td><strong>{subject.code || subject.subjectCode}</strong></td>
                                    <td>{subject.name}</td>
                                    <td>{subject.department}</td>
                                    <td>Sem {subject.semester}</td>
                                    <td><span className="badge badge-info">{subject.credits} Credits</span></td>
                                    <td>
                                        {subject.teacher ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                                <FiUser />
                                                {subject.teacher.user?.firstName} {subject.teacher.user?.lastName}
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>Not Assigned</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(subject)}>
                                                <FiEdit2 /> Edit
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleDelete(subject._id)}
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
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Subject Code *</label>
                                    <input type="text" className="form-input" value={formData.subjectCode} onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })} required placeholder="e.g., CS301" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Credits *</label>
                                    <input type="number" className="form-input" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })} min={1} max={6} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subject Name *</label>
                                <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
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
                                    <label className="form-label">Semester *</label>
                                    <select className="form-select" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })} required>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Max Marks</label>
                                <input type="number" className="form-input" value={formData.maxMarks} onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) })} />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingSubject ? 'Update' : 'Add'} Subject</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSubjects;
