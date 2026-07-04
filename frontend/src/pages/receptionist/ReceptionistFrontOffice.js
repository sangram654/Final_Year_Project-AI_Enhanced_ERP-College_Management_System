import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiTrash2, FiLogOut } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const ReceptionistFrontOffice = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        type: 'visitor', visitorName: '', phone: '', email: '', purpose: '', description: '',
        studentName: '', courseInterested: '', personToMeet: '', idProof: '',
        callType: null, referenceNo: '', fromAddress: '', notes: '',
    });

    const entryTypes = [
        { value: 'visitor', label: '👤 Visitor' },
        { value: 'admission_inquiry', label: '📝 Admission Inquiry' },
        { value: 'phone_call', label: '📞 Phone Call' },
        { value: 'postal', label: '📮 Postal' },
        { value: 'complaint', label: '⚠️ Complaint' },
        { value: 'general', label: '📋 General' },
    ];

    const fetchEntries = useCallback(async () => {
        try {
            const params = {};
            if (typeFilter) params.type = typeFilter;
            const res = await api.get('/front-office', { params });
            if (res.data.success) setEntries(res.data.data);
        } catch (error) { console.error('Error:', error); }
        setLoading(false);
    }, [typeFilter]);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/front-office', formData);
            if (res.data.success) {
                toast.success('Entry created successfully');
                setShowForm(false);
                resetForm();
                fetchEntries();
            }
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to create entry'); }
    };

    const handleCheckout = async (id) => {
        try {
            const res = await api.put(`/front-office/${id}/checkout`);
            if (res.data.success) { toast.success('Visitor checked out'); fetchEntries(); }
        } catch (error) { toast.error('Failed to checkout'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            await api.delete(`/front-office/${id}`);
            toast.success('Entry deleted');
            fetchEntries();
        } catch (error) { toast.error('Failed to delete'); }
    };

    const resetForm = () => {
        setFormData({
            type: 'visitor', visitorName: '', phone: '', email: '', purpose: '', description: '',
            studentName: '', courseInterested: '', personToMeet: '', idProof: '',
            callType: null, referenceNo: '', fromAddress: '', notes: '',
        });
    };

    const getTypeLabel = (type) => {
        const labels = {
            admission_inquiry: '📝 Admission', visitor: '👤 Visitor', phone_call: '📞 Phone',
            postal: '📮 Postal', complaint: '⚠️ Complaint', general: '📋 General',
        };
        return labels[type] || type;
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>📋 Front Office</h1>
                    <p>Manage all front office entries — visitors, inquiries, calls, and more</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                    <FiPlus /> New Entry
                </button>
            </div>

            {/* Type Filter */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-4)' }}>
                <div style={{ padding: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                    <button className={`btn ${!typeFilter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTypeFilter('')}>All</button>
                    {entryTypes.map(t => (
                        <button key={t.value} className={`btn ${typeFilter === t.value ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setTypeFilter(t.value)}>{t.label}</button>
                    ))}
                </div>
            </div>

            {/* Create Entry Form */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflow: 'auto',
                }}>
                    <div style={{
                        background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)',
                        padding: 'var(--spacing-6)', width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto',
                        boxShadow: 'var(--shadow-xl)', margin: 'var(--spacing-4)',
                    }}>
                        <h2 style={{ marginBottom: 'var(--spacing-4)' }}>New Front Office Entry</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
                                <div>
                                    <label className="form-label">Entry Type *</label>
                                    <select className="form-input" required value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        {entryTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                                    <div>
                                        <label className="form-label">Name *</label>
                                        <input className="form-input" required value={formData.visitorName}
                                            onChange={e => setFormData({ ...formData, visitorName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="form-label">Phone</label>
                                        <input className="form-input" value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Purpose *</label>
                                    <input className="form-input" required value={formData.purpose}
                                        onChange={e => setFormData({ ...formData, purpose: e.target.value })} />
                                </div>

                                {/* Conditional fields */}
                                {formData.type === 'visitor' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                                        <div>
                                            <label className="form-label">Person to Meet</label>
                                            <input className="form-input" value={formData.personToMeet}
                                                onChange={e => setFormData({ ...formData, personToMeet: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="form-label">ID Proof</label>
                                            <input className="form-input" value={formData.idProof}
                                                onChange={e => setFormData({ ...formData, idProof: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {formData.type === 'admission_inquiry' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                                        <div>
                                            <label className="form-label">Student Name</label>
                                            <input className="form-input" value={formData.studentName}
                                                onChange={e => setFormData({ ...formData, studentName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="form-label">Course Interested</label>
                                            <input className="form-input" value={formData.courseInterested}
                                                onChange={e => setFormData({ ...formData, courseInterested: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {formData.type === 'phone_call' && (
                                    <div>
                                        <label className="form-label">Call Type</label>
                                        <select className="form-input" value={formData.callType || ''}
                                            onChange={e => setFormData({ ...formData, callType: e.target.value || null })}>
                                            <option value="">Select</option>
                                            <option value="incoming">Incoming</option>
                                            <option value="outgoing">Outgoing</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="form-label">Description / Notes</label>
                                    <textarea className="form-input" rows="3" value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Entries Table */}
            <div className="section-card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr><th>Type</th><th>Name</th><th>Purpose</th><th>Phone</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {entries.map(e => (
                                <tr key={e._id}>
                                    <td>{getTypeLabel(e.type)}</td>
                                    <td><strong>{e.visitorName}</strong></td>
                                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.purpose}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{e.phone || '-'}</td>
                                    <td>
                                        <span style={{
                                            padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                                            background: e.status === 'open' ? '#fff3e0' : e.status === 'closed' ? '#e8f5e9' : '#e3f2fd',
                                            color: e.status === 'open' ? '#e65100' : e.status === 'closed' ? '#2e7d32' : '#1565c0',
                                        }}>{e.status}</span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(e.createdAt).toLocaleString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {e.type === 'visitor' && e.status !== 'closed' && (
                                                <button onClick={() => handleCheckout(e._id)} className="btn btn-primary"
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}><FiLogOut /> Out</button>
                                            )}
                                            <button onClick={() => handleDelete(e._id)} className="btn btn-secondary"
                                                style={{ padding: '4px 8px' }}><FiTrash2 /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {entries.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>No entries found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReceptionistFrontOffice;
