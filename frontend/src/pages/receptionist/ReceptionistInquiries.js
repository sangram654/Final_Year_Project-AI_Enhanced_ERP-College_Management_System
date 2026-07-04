import React, { useState, useEffect, useCallback } from 'react';
import { FiHelpCircle, FiPhone, FiMail, FiBook, FiTrash2, FiPlus, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const ReceptionistInquiries = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        visitorName: '',
        phone: '',
        email: '',
        studentName: '',
        courseInterested: '',
        purpose: '',
        description: '',
        followUpDate: ''
    });

    const fetchInquiries = useCallback(async () => {
        try {
            const params = { type: 'admission_inquiry' };
            if (typeFilter) params.status = typeFilter;
            const res = await api.get('/front-office', { params });
            if (res.data.success) setInquiries(res.data.data);
        } catch (error) {
            console.error('Error:', error);
            setInquiries([]);
        }
        setLoading(false);
    }, [typeFilter]);

    useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                type: 'admission_inquiry'
            };
            const res = await api.post('/front-office', payload);
            if (res.data.success) {
                toast.success('Inquiry recorded successfully');
                setShowForm(false);
                resetForm();
                fetchInquiries();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to record inquiry');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this inquiry?')) return;
        try {
            await api.delete(`/front-office/${id}`);
            toast.success('Inquiry deleted');
            fetchInquiries();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete inquiry');
        }
    };

    const handleClose = async (id) => {
        try {
            const res = await api.put(`/front-office/${id}`, { status: 'closed' });
            if (res.data.success) {
                toast.success('Inquiry marked as resolved');
                fetchInquiries();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update inquiry');
        }
    };

    const resetForm = () => {
        setFormData({
            visitorName: '', phone: '', email: '', studentName: '',
            courseInterested: '', purpose: '', description: '', followUpDate: ''
        });
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'open': return { bg: '#fff3e0', color: '#e65100' };
            case 'closed': return { bg: '#e8f5e9', color: '#2e7d32' };
            default: return { bg: '#e3f2fd', color: '#1565c0' };
        }
    };

    const getUrgencyLevel = (createdAt) => {
        const daysDiff = (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
        if (daysDiff > 7) return { label: 'High', color: '#e74c3c' };
        if (daysDiff > 3) return { label: 'Medium', color: '#f39c12' };
        return { label: 'Low', color: '#27ae60' };
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1><FiHelpCircle style={{ marginRight: 8 }} /> Admission Inquiries</h1>
                    <p>Manage admission inquiries and follow-ups</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                    <FiPlus /> New Inquiry
                </button>
            </div>

            {/* Stats Summary */}
            <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 'var(--spacing-4)' }}>
                <div className="summary-card">
                    <div className="summary-icon total"><FiHelpCircle /></div>
                    <div className="summary-content">
                        <h3>{inquiries.length}</h3>
                        <p>Total Inquiries</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon present"><FiMessageSquare /></div>
                    <div className="summary-content">
                        <h3>{inquiries.filter(i => i.status === 'open').length}</h3>
                        <p>Open Inquiries</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon percentage"><FiBook /></div>
                    <div className="summary-content">
                        <h3>{inquiries.filter(i => i.status === 'closed').length}</h3>
                        <p>Resolved</p>
                    </div>
                </div>
            </div>

            {/* Status Filter */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-4)' }}>
                <div style={{ padding: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                    <button className={`btn ${!typeFilter ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setTypeFilter('')}>All Inquiries</button>
                    <button className={`btn ${typeFilter === 'open' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setTypeFilter('open')}>Open</button>
                    <button className={`btn ${typeFilter === 'closed' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setTypeFilter('closed')}>Resolved</button>
                </div>
            </div>

            {/* Create Inquiry Form */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflow: 'auto'
                }}>
                    <div style={{
                        background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)',
                        padding: 'var(--spacing-6)', width: '100%', maxWidth: 600, maxHeight: '90vh',
                        overflow: 'auto', boxShadow: 'var(--shadow-xl)', margin: 'var(--spacing-4)'
                    }}>
                        <h2 style={{ marginBottom: 'var(--spacing-4)' }}>New Admission Inquiry</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                                    <div>
                                        <label className="form-label">Parent/Guardian Name *</label>
                                        <input className="form-input" required value={formData.visitorName}
                                            onChange={e => setFormData({ ...formData, visitorName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="form-label">Phone *</label>
                                        <input className="form-input" required value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                                    <div>
                                        <label className="form-label">Email</label>
                                        <input type="email" className="form-input" value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="form-label">Student Name *</label>
                                        <input className="form-input" required value={formData.studentName}
                                            onChange={e => setFormData({ ...formData, studentName: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                                    <div>
                                        <label className="form-label">Course Interested *</label>
                                        <select className="form-input" required value={formData.courseInterested}
                                            onChange={e => setFormData({ ...formData, courseInterested: e.target.value })}>
                                            <option value="">Select Course</option>
                                            <option value="Computer Engineering">Computer Engineering</option>
                                            <option value="Information Technology">Information Technology</option>
                                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                                            <option value="Civil Engineering">Civil Engineering</option>
                                            <option value="Electrical Engineering">Electrical Engineering</option>
                                            <option value="Electronics Engineering">Electronics Engineering</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Follow-up Date</label>
                                        <input type="date" className="form-input" value={formData.followUpDate}
                                            onChange={e => setFormData({ ...formData, followUpDate: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Purpose *</label>
                                    <input className="form-input" required value={formData.purpose}
                                        placeholder="e.g., Admission Information, Fee Structure, Document Requirements"
                                        onChange={e => setFormData({ ...formData, purpose: e.target.value })} />
                                </div>

                                <div>
                                    <label className="form-label">Details / Notes</label>
                                    <textarea className="form-input" rows="3" value={formData.description}
                                        placeholder="Additional details about the inquiry..."
                                        onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Record Inquiry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inquiries Table */}
            <div className="section-card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Parent/Guardian</th>
                                <th>Student & Course</th>
                                <th>Purpose</th>
                                <th>Contact</th>
                                <th>Date</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inquiries.map(inquiry => {
                                const statusColor = getStatusColor(inquiry.status);
                                const urgency = getUrgencyLevel(inquiry.createdAt);
                                return (
                                    <tr key={inquiry._id}>
                                        <td><strong>{inquiry.visitorName}</strong></td>
                                        <td>
                                            <div>
                                                <strong>{inquiry.studentName}</strong>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {inquiry.courseInterested}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {inquiry.purpose}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <div><FiPhone size={12} /> {inquiry.phone}</div>
                                                {inquiry.email && <div><FiMail size={12} /> {inquiry.email}</div>}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.8rem' }}>
                                            {new Date(inquiry.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: 8,
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                background: urgency.color + '20',
                                                color: urgency.color,
                                            }}>
                                                {urgency.label}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '3px 12px',
                                                borderRadius: 12,
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: statusColor.bg,
                                                color: statusColor.color,
                                            }}>
                                                {inquiry.status === 'open' ? 'Open' : 'Resolved'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {inquiry.status === 'open' && (
                                                    <button
                                                        onClick={() => handleClose(inquiry._id)}
                                                        className="btn btn-primary"
                                                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                    >
                                                        Mark Resolved
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(inquiry._id)}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '4px 8px' }}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {inquiries.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: 40 }}>
                                        No inquiries found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReceptionistInquiries;