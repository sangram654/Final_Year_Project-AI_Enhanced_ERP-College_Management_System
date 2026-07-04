import React, { useState, useEffect, useCallback } from 'react';
import { FiMessageSquare, FiMail, FiPhone, FiSend, FiUsers, FiPlus, FiBell } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const ReceptionistCommunicate = () => {
    const [communications, setCommunications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        type: 'announcement',
        recipient: 'all_students',
        subject: '',
        message: '',
        priority: 'normal',
        scheduledFor: ''
    });

    const communicationTypes = [
        { value: 'announcement', label: '📢 Announcement', icon: FiBell },
        { value: 'sms', label: '📱 SMS', icon: FiPhone },
        { value: 'email', label: '✉️ Email', icon: FiMail },
        { value: 'notice', label: '📋 Notice Board', icon: FiMessageSquare }
    ];

    const recipientOptions = [
        { value: 'all_students', label: 'All Students' },
        { value: 'all_parents', label: 'All Parents' },
        { value: 'all_teachers', label: 'All Teachers' },
        { value: 'specific_department', label: 'Specific Department' },
        { value: 'specific_semester', label: 'Specific Semester' },
        { value: 'custom', label: 'Custom Recipients' }
    ];

    const fetchCommunications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/communications');
            if (res.data.success) {
                setCommunications(res.data.data || []);
            }
        } catch (error) {
            console.error('Error:', error);
            setCommunications([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchCommunications(); }, [fetchCommunications]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/communications', formData);
            if (res.data.success) {
                toast.success('Communication sent successfully');
                setShowForm(false);
                resetForm();
                fetchCommunications();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send communication');
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'announcement',
            recipient: 'all_students',
            subject: '',
            message: '',
            priority: 'normal',
            scheduledFor: ''
        });
    };

    const getTypeIcon = (type) => {
        const typeObj = communicationTypes.find(t => t.value === type);
        return typeObj ? typeObj.icon : FiMessageSquare;
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'sent': return { bg: '#e8f5e9', color: '#2e7d32' };
            case 'scheduled': return { bg: '#e3f2fd', color: '#1565c0' };
            case 'failed': return { bg: '#ffebee', color: '#c62828' };
            default: return { bg: '#fff3e0', color: '#e65100' };
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'high': return '#e74c3c';
            case 'urgent': return '#c62828';
            case 'low': return '#27ae60';
            default: return '#3498db';
        }
    };

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1><FiMessageSquare style={{ marginRight: 8 }} /> Communication Center</h1>
                    <p>Send announcements, emails, and notifications to students, parents, and teachers</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                    <FiPlus /> New Communication
                </button>
            </div>

            {/* Quick Actions */}
            <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: 'var(--spacing-4)' }}>
                {communicationTypes.map(type => {
                    const Icon = type.icon;
                    return (
                        <div key={type.value} className="summary-card" style={{ cursor: 'pointer' }}
                            onClick={() => {
                                setFormData(prev => ({ ...prev, type: type.value }));
                                setShowForm(true);
                            }}>
                            <div className="summary-icon total"><Icon /></div>
                            <div className="summary-content">
                                <h3>{type.label.replace(/📢|📱|✉️|📋/, '').trim()}</h3>
                                <p>Send {type.label.toLowerCase().replace(/📢|📱|✉️|📋/, '').trim()}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Communication Form */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflow: 'auto'
                }}>
                    <div style={{
                        background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)',
                        padding: 'var(--spacing-6)', width: '100%', maxWidth: 700, maxHeight: '90vh',
                        overflow: 'auto', boxShadow: 'var(--shadow-xl)', margin: 'var(--spacing-4)'
                    }}>
                        <h2 style={{ marginBottom: 'var(--spacing-4)' }}>New Communication</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                                    <div>
                                        <label className="form-label">Communication Type *</label>
                                        <select className="form-input" required value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                            {communicationTypes.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Recipients *</label>
                                        <select className="form-input" required value={formData.recipient}
                                            onChange={e => setFormData({ ...formData, recipient: e.target.value })}>
                                            {recipientOptions.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--spacing-3)' }}>
                                    <div>
                                        <label className="form-label">Subject *</label>
                                        <input className="form-input" required value={formData.subject}
                                            placeholder="Enter subject/title for the communication"
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="form-label">Priority</label>
                                        <select className="form-input" value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Message *</label>
                                    <textarea className="form-input" required rows="4" value={formData.message}
                                        placeholder="Enter your message content..."
                                        onChange={e => setFormData({ ...formData, message: e.target.value })} />
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Characters: {formData.message.length}
                                        {formData.type === 'sms' && formData.message.length > 160 &&
                                            <span style={{ color: '#e74c3c' }}> (SMS limit exceeded)</span>
                                        }
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Schedule For Later (Optional)</label>
                                    <input type="datetime-local" className="form-input" value={formData.scheduledFor}
                                        onChange={e => setFormData({ ...formData, scheduledFor: e.target.value })} />
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Leave empty to send immediately
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="section-card" style={{ margin: 0, background: 'var(--bg-secondary)' }}>
                                    <div style={{ padding: 'var(--spacing-3)' }}>
                                        <strong>Preview:</strong>
                                        <div style={{ marginTop: 'var(--spacing-2)', fontSize: '0.9rem' }}>
                                            <div style={{ fontWeight: 600 }}>To: {recipientOptions.find(r => r.value === formData.recipient)?.label}</div>
                                            <div style={{ fontWeight: 600, marginTop: '4px' }}>Subject: {formData.subject || 'No subject'}</div>
                                            <div style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                                                {formData.message || 'No message content'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    <FiSend /> {formData.scheduledFor ? 'Schedule' : 'Send Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Communications History */}
            <div className="section-card">
                <div className="section-header">
                    <h2>Communication History</h2>
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
                                    <th>Type & Subject</th>
                                    <th>Recipients</th>
                                    <th>Message Preview</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Date/Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {communications.map(comm => {
                                    const TypeIcon = getTypeIcon(comm.type);
                                    const statusColor = getStatusColor(comm.status);
                                    return (
                                        <tr key={comm._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <TypeIcon size={16} />
                                                    <div>
                                                        <strong>{comm.subject}</strong>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                                            {comm.type}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <div>{recipientOptions.find(r => r.value === comm.recipient)?.label}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {comm.recipientCount} recipients
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ maxWidth: 250 }}>
                                                <div style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {comm.message}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-block',
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    backgroundColor: getPriorityColor(comm.priority),
                                                    marginRight: '8px'
                                                }}></span>
                                                {comm.priority}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '3px 12px',
                                                    borderRadius: 12,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    background: statusColor.bg,
                                                    color: statusColor.color,
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {comm.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>
                                                {comm.status === 'scheduled' ? (
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)' }}>Scheduled for:</div>
                                                        <div>{new Date(comm.scheduledFor).toLocaleString()}</div>
                                                    </div>
                                                ) : (
                                                    <div>{new Date(comm.sentAt).toLocaleString()}</div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {communications.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>
                                            No communications sent yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReceptionistCommunicate;