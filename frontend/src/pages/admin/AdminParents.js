import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiMail, FiPhone, FiCopy, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const AdminParents = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [parents, setParents] = useState([]);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [editingParent, setEditingParent] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        relation: '',
        occupation: '',
        annualIncome: '',
        studentIds: []
    });

    useEffect(() => {
        fetchParents();
        fetchStudents();
    }, []);

    const fetchParents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/parents');
            setParents(res.data.data || []);
        } catch (error) {
            console.error('Error fetching parents:', error);
            toast.error('Failed to fetch parents');
            setParents([]);
        }
        setLoading(false);
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students');
            setStudents(res.data.data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingParent) {
                // Update existing parent
                const res = await api.put(`/parents/${editingParent._id}`, formData);
                if (res.data.success) {
                    toast.success('Parent updated successfully!');
                    fetchParents();
                }
            } else {
                // Create new parent via API
                const res = await api.post('/parents', formData);
                if (res.data.success) {
                    toast.success('Parent added successfully!');
                    fetchParents();

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

    const handleDelete = async (parentId) => {
        if (window.confirm('Are you sure you want to delete this parent? This action cannot be undone.')) {
            try {
                await api.delete(`/parents/${parentId}`);
                toast.success('Parent deleted successfully');
                fetchParents();
            } catch (error) {
                console.error('Error deleting parent:', error);
                toast.error(error.response?.data?.message || 'Failed to delete parent');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            relation: '',
            occupation: '',
            annualIncome: '',
            studentIds: []
        });
        setEditingParent(null);
    };

    const openEditModal = (parent) => {
        setEditingParent(parent);
        setFormData({
            firstName: parent.user?.firstName || '',
            lastName: parent.user?.lastName || '',
            email: parent.user?.email || '',
            phone: parent.user?.phone || '',
            relation: parent.relation || '',
            occupation: parent.occupation || '',
            annualIncome: parent.annualIncome || '',
            studentIds: parent.students?.map(s => s._id || s) || []
        });
        setShowModal(true);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const handleStudentSelect = (studentId) => {
        setFormData(prev => {
            const current = prev.studentIds || [];
            if (current.includes(studentId)) {
                return { ...prev, studentIds: current.filter(id => id !== studentId) };
            } else {
                return { ...prev, studentIds: [...current, studentId] };
            }
        });
    };

    const filteredParents = parents.filter(parent => {
        const name = `${parent.user?.firstName || ''} ${parent.user?.lastName || ''}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase()) ||
            parent.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            parent.user?.phone?.includes(searchQuery);
    });

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading parents...</p>
            </div>
        );
    }

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Manage Parents</h1>
                    <p>Add, edit, and manage parent/guardian records</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <FiPlus /> Add Parent
                </button>
            </div>

            {/* Filters */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div style={{ padding: 'var(--spacing-6)' }}>
                    <div className="form-group" style={{ position: 'relative', maxWidth: '400px' }}>
                        <label className="form-label">Search</label>
                        <div style={{ position: 'relative' }}>
                            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name, email, or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="summary-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="summary-card">
                    <div className="summary-icon total" style={{ background: '#e8f5e9', color: '#388e3c' }}>
                        <FiUsers />
                    </div>
                    <div className="summary-content">
                        <h3>{parents.length}</h3>
                        <p>Total Parents</p>
                    </div>
                </div>
            </div>

            {/* Parents Table */}
            <div className="section-card">
                <div className="section-header">
                    <h2>Parent List ({filteredParents.length})</h2>
                </div>
                <div className="table-container">
                    {filteredParents.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Relation</th>
                                    <th>Ward(s)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParents.map((parent) => (
                                    <tr key={parent._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#388e3c', fontWeight: 600 }}>
                                                    {parent.user?.firstName?.charAt(0) || 'P'}
                                                </div>
                                                <div>
                                                    {parent.user?.firstName} {parent.user?.lastName}
                                                    <br />
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{parent.occupation || '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiMail size={12} /> {parent.user?.email}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}><FiPhone size={12} /> {parent.user?.phone || '-'}</div>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-info">{parent.relation || '-'}</span></td>
                                        <td>
                                            {parent.students?.length > 0 ? (
                                                parent.students.map((student, idx) => (
                                                    <span key={idx} className="badge badge-primary" style={{ marginRight: 4 }}>
                                                        {student.user?.firstName || student.rollNumber || 'Student'}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>No ward linked</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(parent)}>
                                                    <FiEdit2 /> Edit
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleDelete(parent._id)}
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
                            <FiUsers size={48} />
                            <h3>No Parents Found</h3>
                            <p>Add your first parent by clicking the "Add Parent" button above.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2>{editingParent ? 'Edit Parent' : 'Add New Parent'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: 'var(--spacing-4)' }}>
                                {/* Personal Information */}
                                <h3 style={{ marginBottom: 'var(--spacing-4)', color: '#388e3c' }}>Personal Information</h3>
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
                                        <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={editingParent} />
                                        {editingParent && <small style={{ color: 'var(--text-muted)' }}>Email cannot be changed</small>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone *</label>
                                        <input type="tel" className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                                        {!editingParent && <small style={{ color: 'var(--text-muted)' }}>Password will be: parent@Phone</small>}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Relation *</label>
                                        <select className="form-select" value={formData.relation} onChange={(e) => setFormData({ ...formData, relation: e.target.value })} required>
                                            <option value="">Select Relation</option>
                                            <option value="Father">Father</option>
                                            <option value="Mother">Mother</option>
                                            <option value="Guardian">Guardian</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Occupation</label>
                                        <input type="text" className="form-input" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} placeholder="e.g., Engineer, Doctor" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Annual Income (₹)</label>
                                        <input type="number" className="form-input" value={formData.annualIncome} onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })} min="0" placeholder="e.g., 500000" />
                                    </div>
                                </div>

                                {/* Link Students */}
                                <h3 style={{ marginTop: 'var(--spacing-6)', marginBottom: 'var(--spacing-4)', color: '#388e3c' }}>Link Ward(s)</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-3)' }}>
                                    Select the student(s) this parent is responsible for:
                                </p>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)' }}>
                                    {students.length > 0 ? (
                                        students.map(student => (
                                            <label key={student._id} className="checkbox-wrapper" style={{ display: 'flex', padding: 'var(--spacing-2)', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.studentIds?.includes(student._id)}
                                                    onChange={() => handleStudentSelect(student._id)}
                                                    style={{ marginRight: 'var(--spacing-2)' }}
                                                />
                                                <span>
                                                    <strong>{student.user?.firstName} {student.user?.lastName}</strong>
                                                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                                                        ({student.rollNumber}) - {student.department}, Sem {student.semester}
                                                    </span>
                                                </span>
                                            </label>
                                        ))
                                    ) : (
                                        <p style={{ color: 'var(--text-muted)', padding: 'var(--spacing-4)', textAlign: 'center' }}>
                                            No students available. Add students first.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="form-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editingParent ? 'Update' : 'Add')} Parent
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
                            <h2>✓ Parent Created Successfully!</h2>
                            <button className="modal-close" onClick={() => setShowCredentials(false)} style={{ color: 'white' }}>×</button>
                        </div>
                        <div style={{ padding: 'var(--spacing-6)' }}>
                            <p style={{ marginBottom: 'var(--spacing-4)', color: 'var(--text-secondary)' }}>
                                Please share the following login credentials with the parent:
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

export default AdminParents;
