import React, { useState, useEffect, useCallback } from 'react';
import { FiCalendar, FiPlus, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { leaveService } from '../../services/api';
import './StudentPages.css';

const StudentLeave = () => {
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        leaveType: 'Sick Leave',
        fromDate: '',
        toDate: '',
        reason: '',
    });

    const fetchLeaves = useCallback(async () => {
        try {
            const res = await leaveService.getMyLeaves();
            setLeaves(res.data.data || []);
        } catch (error) {
            console.error('Error fetching leaves:', error);
            setLeaves([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await leaveService.apply(formData);
            toast.success('Leave application submitted successfully');
            setShowForm(false);
            fetchLeaves();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit leave application');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <FiCheck />;
            case 'Rejected': return <FiX />;
            default: return <FiClock />;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Approved': return 'badge-success';
            case 'Rejected': return 'badge-error';
            default: return 'badge-warning';
        }
    };

    const summary = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'Pending').length,
        approved: leaves.filter(l => l.status === 'Approved').length,
        rejected: leaves.filter(l => l.status === 'Rejected').length,
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading leave applications...</p>
            </div>
        );
    }

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Leave Application</h1>
                    <p>Apply for leave and track your applications</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <FiPlus /> Apply Leave
                </button>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-icon total">
                        <FiCalendar />
                    </div>
                    <div className="summary-content">
                        <h3>{summary.total}</h3>
                        <p>Total Applications</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon percentage">
                        <FiClock />
                    </div>
                    <div className="summary-content">
                        <h3>{summary.pending}</h3>
                        <p>Pending</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon present">
                        <FiCheck />
                    </div>
                    <div className="summary-content">
                        <h3>{summary.approved}</h3>
                        <p>Approved</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon absent">
                        <FiX />
                    </div>
                    <div className="summary-content">
                        <h3>{summary.rejected}</h3>
                        <p>Rejected</p>
                    </div>
                </div>
            </div>

            {/* Leave Form */}
            {showForm && (
                <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="section-header">
                        <h2>New Leave Application</h2>
                    </div>
                    <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-6)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                            <div className="form-group">
                                <label className="form-label">Leave Type</label>
                                <select
                                    className="form-select"
                                    value={formData.leaveType}
                                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                                    required
                                >
                                    <option value="Sick Leave">Sick Leave</option>
                                    <option value="Casual Leave">Casual Leave</option>
                                    <option value="Emergency Leave">Emergency Leave</option>
                                    <option value="Medical Leave">Medical Leave</option>
                                    <option value="Personal">Personal</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div></div>
                            <div className="form-group">
                                <label className="form-label">From Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.fromDate}
                                    onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">To Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.toDate}
                                    onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Reason</label>
                            <textarea
                                className="form-textarea"
                                rows="3"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Explain the reason for your leave..."
                                required
                            ></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Submit Application</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Leave Applications Table */}
            <div className="section-card">
                <div className="section-header">
                    <h2>My Applications</h2>
                </div>
                {leaves.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Duration</th>
                                    <th>Days</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Applied On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map((leave) => (
                                    <tr key={leave._id}>
                                        <td><strong>{leave.leaveType}</strong></td>
                                        <td>
                                            {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                                        </td>
                                        <td>{leave.numberOfDays}</td>
                                        <td style={{ maxWidth: 200 }}>{leave.reason}</td>
                                        <td>
                                            <span className={`badge ${getStatusClass(leave.status)}`}>
                                                {getStatusIcon(leave.status)} {leave.status}
                                            </span>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                                T: {leave.approvalFlow?.teacher?.status || 'Pending'} | A: {leave.approvalFlow?.admin?.status || 'Pending'} | SA: {leave.approvalFlow?.superAdmin?.status || 'Pending'}
                                            </div>
                                        </td>
                                        <td>{new Date(leave.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <FiCalendar size={48} />
                        <h3>No leave applications</h3>
                        <p>Click "Apply Leave" to submit a new application</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentLeave;
