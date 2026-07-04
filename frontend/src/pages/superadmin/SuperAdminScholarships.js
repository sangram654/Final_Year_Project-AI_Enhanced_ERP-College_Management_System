import React, { useState, useEffect } from 'react';
import { FiAward, FiPlus, FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const SuperAdminScholarships = () => {
    const [loading, setLoading] = useState(true);
    const [scholarships, setScholarships] = useState([]);
    const [applications, setApplications] = useState([]);
    const [activeTab, setActiveTab] = useState('scholarships');
    const [showModal, setShowModal] = useState(false);
    const [editingScholarship, setEditingScholarship] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'Merit',
        amount: '',
        eligibilityCriteria: '',
        applicationDeadline: '',
        academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        isActive: true,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [scholarshipsRes, applicationsRes] = await Promise.all([
                api.get('/scholarships'),
                api.get('/scholarships/admin/applications').catch(() => ({ data: { data: [] } })),
            ]);
            setScholarships(scholarshipsRes.data.data || []);
            setApplications(applicationsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching scholarships/applications:', error);
            setScholarships([]);
            setApplications([]);
        }
        setLoading(false);
    };

    const defaultFormData = () => ({
        name: '',
        description: '',
        type: 'Merit',
        amount: '',
        eligibilityCriteria: '',
        applicationDeadline: '',
        academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        isActive: true,
    });

    const parseScholarshipDescription = (description = '') => {
        const lines = String(description).split('\n');
        const eligibilityLine = lines.find((line) => /^\s*Eligibility\s*:/i.test(line));
        const cleanDescription = lines
            .filter((line) => !/^\s*Eligibility\s*:/i.test(line))
            .join('\n')
            .trim();

        return {
            description: cleanDescription,
            eligibilityCriteria: eligibilityLine
                ? eligibilityLine.replace(/^\s*Eligibility\s*:/i, '').trim()
                : '',
        };
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingScholarship(null);
        setFormData(defaultFormData());
    };

    const openCreateModal = () => {
        setEditingScholarship(null);
        setFormData(defaultFormData());
        setShowModal(true);
    };

    const openEditModal = (scholarship) => {
        const parsed = parseScholarshipDescription(scholarship.description || '');
        setEditingScholarship(scholarship);
        setFormData({
            name: scholarship.name || '',
            description: parsed.description,
            type: scholarship.type || 'Merit',
            amount: scholarship.amount || '',
            eligibilityCriteria: scholarship.eligibilityCriteria || parsed.eligibilityCriteria || '',
            applicationDeadline: scholarship.deadline ? new Date(scholarship.deadline).toISOString().slice(0, 10) : '',
            academicYear: scholarship.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            isActive: scholarship.isActive !== false,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const scholarshipData = {
                name: formData.name,
                description: formData.eligibilityCriteria
                    ? `${formData.description}\nEligibility: ${formData.eligibilityCriteria}`.trim()
                    : formData.description,
                type: formData.type,
                amount: parseInt(formData.amount, 10),
                deadline: formData.applicationDeadline,
                academicYear: formData.academicYear,
                isActive: formData.isActive,
            };
            const res = editingScholarship
                ? await api.put(`/scholarships/${editingScholarship._id}`, scholarshipData)
                : await api.post('/scholarships', scholarshipData);
            if (res.data.success) {
                toast.success(editingScholarship ? 'Scholarship updated successfully!' : 'Scholarship created successfully!');
                fetchData();
                closeModal();
            }
        } catch (error) {
            console.error('Scholarship save failed:', error);
            toast.error(error.response?.data?.message || (editingScholarship ? 'Failed to update scholarship' : 'Failed to create scholarship'));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this scholarship?')) {
            try {
                const res = await api.delete(`/scholarships/${id}`);
                if (res.data.success) {
                    toast.success('Scholarship deleted successfully');
                    fetchData();
                }
            } catch (error) {
                console.error('Delete failed:', error);
                toast.error(error.response?.data?.message || 'Failed to delete scholarship');
            }
        }
    };

    const handleApplicationStatus = async (appId, status) => {
        try {
            const res = await api.put(`/scholarships/applications/${appId}/review`, { status });
            if (res.data.success) {
                toast.success(`Application ${status.toLowerCase()}`);
                fetchData();
            }
        } catch (error) {
            console.error('Status update failed:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Approved': return 'badge-success';
            case 'Rejected': return 'badge-error';
            case 'Pending': return 'badge-warning';
            default: return 'badge-info';
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading scholarships...</p>
            </div>
        );
    }

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Scholarship Management</h1>
                    <p>Create and manage scholarship programs</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <FiPlus /> Add Scholarship
                </button>
            </div>

            {/* Tabs */}
            <div
                className="tabs"
                style={{
                    marginBottom: 'var(--spacing-6)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-2)'
                }}
            >
                <button
                    className={`tab ${activeTab === 'scholarships' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scholarships')}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: activeTab === 'scholarships' ? '1px solid var(--primary-500)' : '1px solid var(--border-color)',
                        background: activeTab === 'scholarships' ? 'var(--primary-50)' : 'var(--bg-primary)',
                        color: activeTab === 'scholarships' ? 'var(--primary-700)' : 'var(--text-primary)',
                        fontWeight: 600,
                        lineHeight: 1.2
                    }}
                >
                    <FiAward /> Scholarships ({scholarships.length})
                </button>
                <button
                    className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: activeTab === 'applications' ? '1px solid var(--primary-500)' : '1px solid var(--border-color)',
                        background: activeTab === 'applications' ? 'var(--primary-50)' : 'var(--bg-primary)',
                        color: activeTab === 'applications' ? 'var(--primary-700)' : 'var(--text-primary)',
                        fontWeight: 600,
                        lineHeight: 1.2
                    }}
                >
                    <FiUsers /> Applications ({applications.length})
                </button>
            </div>

            {activeTab === 'scholarships' ? (
                <div className="section-card">
                    <div className="section-header">
                        <h2>Available Scholarships</h2>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Amount</th>
                                    <th>Eligibility</th>
                                    <th>Deadline</th>
                                    <th>Applicants</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scholarships.map((scholarship) => {
                                    const parsed = parseScholarshipDescription(scholarship.description || '');
                                    const applicantCount = applications.filter((app) => app.scholarship?._id === scholarship._id).length;
                                    return (
                                    <tr key={scholarship._id}>
                                        <td>
                                            <strong>{scholarship.name}</strong>
                                            <br />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{parsed.description || scholarship.description}</span>
                                        </td>
                                        <td style={{ color: 'var(--success-color)', fontWeight: 600 }}>₹{scholarship.amount?.toLocaleString()}</td>
                                        <td>{parsed.eligibilityCriteria || scholarship.eligibilityCriteria || 'Refer description'}</td>
                                        <td>{scholarship.deadline ? new Date(scholarship.deadline).toLocaleDateString() : '-'}</td>
                                        <td>{applicantCount}</td>
                                        <td>
                                            <span className={`badge ${scholarship.isActive ? 'badge-success' : 'badge-warning'}`}>
                                                {scholarship.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(scholarship)} title="Edit Scholarship"><FiEdit2 /></button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(scholarship._id)} style={{ color: 'var(--error-color)' }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="section-card">
                    <div className="section-header">
                        <h2>Scholarship Applications</h2>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Scholarship</th>
                                    <th>Applied On</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app._id}>
                                        <td>
                                            <strong>{app.student?.user?.firstName} {app.student?.user?.lastName}</strong>
                                            <br />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.student?.rollNumber}</span>
                                        </td>
                                        <td>{app.scholarship?.name}</td>
                                        <td>{new Date(app.applicationDate || app.appliedAt || app.createdAt).toLocaleDateString()}</td>
                                        <td><span className={`badge ${getStatusClass(app.status)}`}>{app.status}</span></td>
                                        <td>
                                            {app.status === 'Pending' && (
                                                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleApplicationStatus(app._id, 'Approved')}>Approve</button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleApplicationStatus(app._id, 'Rejected')} style={{ color: 'var(--error-color)' }}>Reject</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Scholarship Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><FiAward /> {editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Scholarship Name *</label>
                                <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Type *</label>
                                    <select className="form-input" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required>
                                        <option value="Merit">Merit</option>
                                        <option value="Need-Based">Need-Based</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Government">Government</option>
                                        <option value="Private">Private</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount (₹) *</label>
                                    <input type="number" className="form-input" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Application Deadline *</label>
                                    <input type="date" className="form-input" value={formData.applicationDeadline} onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Academic Year *</label>
                                    <input type="text" className="form-input" value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Eligibility Criteria</label>
                                <textarea className="form-input" rows={2} value={formData.eligibilityCriteria} onChange={(e) => setFormData({ ...formData, eligibilityCriteria: e.target.value })} placeholder="e.g., CGPA > 8.0, Income < 5 LPA" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-input" value={formData.isActive ? 'active' : 'inactive'} onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingScholarship ? 'Update Scholarship' : 'Create Scholarship'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminScholarships;
