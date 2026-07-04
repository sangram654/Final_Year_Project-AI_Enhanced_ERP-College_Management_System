import React, { useState, useEffect, useCallback } from 'react';
import { FiCheck, FiX, FiCalendar, FiUser, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../student/StudentPages.css';

const SuperAdminLeaves = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState([]);
    const [filter, setFilter] = useState('Pending');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applying, setApplying] = useState(false);
    const [applyFormData, setApplyFormData] = useState({
        leaveType: 'Sick Leave',
        fromDate: '',
        toDate: '',
        reason: '',
    });

    const handleApplySubmit = async (e) => {
        e.preventDefault();
        setApplying(true);
        try {
            await api.post('/leave', applyFormData);
            toast.success('Leave application submitted successfully');
            setShowApplyModal(false);
            setApplyFormData({
                leaveType: 'Sick Leave',
                fromDate: '',
                toDate: '',
                reason: '',
            });
            fetchLeaves();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit leave application');
        }
        setApplying(false);
    };

    const fetchLeaves = useCallback(async () => {
        try {
            const res = await api.get(`/leave?status=${filter}`);
            setLeaves(res.data.data || []);
        } catch (error) {
            console.error('Error fetching leaves:', error);
            setLeaves([]);
        }
        setLoading(false);
    }, [filter]);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const handleReview = async (leaveId, status) => {
        try {
            await api.put(`/leave/${leaveId}/review`, { status, reviewRemarks: `${status} by admin` });
            toast.success(`Leave ${status.toLowerCase()} successfully`);
            fetchLeaves();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update leave');
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Approved': return 'badge-success';
            case 'Rejected': return 'badge-error';
            default: return 'badge-warning';
        }
    };

    const getRoleFlowKey = () => {
        if (user?.role === 'super_admin') return 'superAdmin';
        if (user?.role === 'admin') return 'admin';
        if (user?.role === 'teacher') return 'teacher';
        return null;
    };

    const getApprovalProgress = (leave) => {
        const flow = leave.approvalFlow || {};
        const steps = leave.applicantType === 'Teacher'
            ? ['admin', 'superAdmin']
            : ['teacher', 'admin', 'superAdmin'];
        return steps.filter((s) => flow[s]?.status === 'Approved').length;
    };

    const getTotalApprovalSteps = (leave) => (
        leave.applicantType === 'Teacher' ? 2 : 3
    );

    const canCurrentRoleReview = (leave) => {
        if (leave.status !== 'Pending') return false;
        const roleKey = getRoleFlowKey();
        if (!roleKey) return false;
        const roleStatus = leave.approvalFlow?.[roleKey]?.status || 'Pending';
        return roleStatus === 'Pending';
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
                    <h1>Leave Applications</h1>
                    <p>3-step approvals by Teacher, Admin, and Super Admin</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
                    <FiPlus /> Apply Leave
                </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ marginBottom: 'var(--spacing-6)', display: 'flex', gap: 'var(--spacing-2)' }}>
                {['Pending', 'Approved', 'Rejected', 'All'].map((tab) => (
                    <button
                        key={tab}
                        className={`btn ${filter === tab || (tab === 'All' && filter === '') ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter(tab === 'All' ? '' : tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Leave List */}
            <div className="section-card">
                <div className="section-header">
                    <h2><FiCalendar style={{ marginRight: 8 }} /> Applications ({leaves.length})</h2>
                </div>
                {leaves.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Applicant</th>
                                    <th>Type</th>
                                    <th>Duration</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Progress</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map((leave) => (
                                    <tr key={leave._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                                <FiUser />
                                                <div>
                                                    <strong>{leave.applicant?.firstName} {leave.applicant?.lastName}</strong>
                                                    <br />
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leave.applicantType}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{leave.leaveType}</td>
                                        <td>
                                            {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                                            <br />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leave.numberOfDays} day(s)</span>
                                        </td>
                                        <td style={{ maxWidth: 200 }}>{leave.reason}</td>
                                        <td>
                                            <span className={`badge ${getStatusClass(leave.status)}`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                {getApprovalProgress(leave)}/{getTotalApprovalSteps(leave)} approved
                                                <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                                                    {leave.applicantType === 'Student' && (
                                                        <>T: {leave.approvalFlow?.teacher?.status || 'Pending'} | </>
                                                    )}
                                                    A: {leave.approvalFlow?.admin?.status || 'Pending'} | SA: {leave.approvalFlow?.superAdmin?.status || 'Pending'}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {canCurrentRoleReview(leave) ? (
                                                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleReview(leave._id, 'Approved')}
                                                    >
                                                        <FiCheck /> Approve
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleReview(leave._id, 'Rejected')}
                                                        style={{ color: 'var(--error-color)' }}
                                                    >
                                                        <FiX /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <FiCalendar size={48} />
                        <h3>No leave applications</h3>
                        <p>No {filter.toLowerCase()} leave applications found</p>
                    </div>
                )}
            </div>

            {/* Apply Leave Modal */}
            {showApplyModal && (
                <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Apply for Leave</h2>
                            <button className="modal-close" onClick={() => setShowApplyModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleApplySubmit}>
                            <div style={{ padding: 'var(--spacing-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Leave Type *</label>
                                    <select
                                        className="form-select"
                                        value={applyFormData.leaveType}
                                        onChange={(e) => setApplyFormData({ ...applyFormData, leaveType: e.target.value })}
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
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="form-group">
                                        <label className="form-label">From Date *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={applyFormData.fromDate}
                                            onChange={(e) => setApplyFormData({ ...applyFormData, fromDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">To Date *</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={applyFormData.toDate}
                                            onChange={(e) => setApplyFormData({ ...applyFormData, toDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reason *</label>
                                    <textarea
                                        className="form-textarea"
                                        rows="4"
                                        value={applyFormData.reason}
                                        onChange={(e) => setApplyFormData({ ...applyFormData, reason: e.target.value })}
                                        placeholder="Please provide a detailed reason for your leave request..."
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            <div className="form-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={applying}>
                                    {applying ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminLeaves;
