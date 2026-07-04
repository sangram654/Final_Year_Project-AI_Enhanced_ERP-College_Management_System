import React, { useState, useEffect, useCallback } from 'react';
import { FiUser, FiClock, FiLogOut, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const ReceptionistVisitors = () => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchVisitors = useCallback(async () => {
        try {
            const params = { type: 'visitor' };
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/front-office', { params });
            if (res.data.success) setVisitors(res.data.data);
        } catch (error) {
            console.error('Error:', error);
            setVisitors([]);
        }
        setLoading(false);
    }, [statusFilter]);

    useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

    const handleCheckout = async (id) => {
        try {
            const res = await api.put(`/front-office/${id}/checkout`);
            if (res.data.success) {
                toast.success('Visitor checked out successfully');
                fetchVisitors();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to checkout visitor');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this visitor record?')) return;
        try {
            await api.delete(`/front-office/${id}`);
            toast.success('Visitor record deleted');
            fetchVisitors();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete visitor record');
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'open': return { bg: '#fff3e0', color: '#e65100' };
            case 'closed': return { bg: '#e8f5e9', color: '#2e7d32' };
            default: return { bg: '#e3f2fd', color: '#1565c0' };
        }
    };

    const formatDuration = (checkIn, checkOut) => {
        if (!checkOut) return 'Active';
        const duration = new Date(checkOut) - new Date(checkIn);
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1><FiUser style={{ marginRight: 8 }} /> Visitor Log</h1>
                    <p>Track all visitors, check-ins and check-outs</p>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--spacing-4)' }}>
                <div className="summary-card">
                    <div className="summary-icon total"><FiUser /></div>
                    <div className="summary-content">
                        <h3>{visitors.length}</h3>
                        <p>Total Visitors Today</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon present"><FiClock /></div>
                    <div className="summary-content">
                        <h3>{visitors.filter(v => v.status === 'open').length}</h3>
                        <p>Currently Inside</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon percentage"><FiLogOut /></div>
                    <div className="summary-content">
                        <h3>{visitors.filter(v => v.status === 'closed').length}</h3>
                        <p>Checked Out</p>
                    </div>
                </div>
            </div>

            {/* Status Filter */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-4)' }}>
                <div style={{ padding: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-2)' }}>
                    <button className={`btn ${!statusFilter ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setStatusFilter('')}>All Visitors</button>
                    <button className={`btn ${statusFilter === 'open' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setStatusFilter('open')}>Active</button>
                    <button className={`btn ${statusFilter === 'closed' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setStatusFilter('closed')}>Checked Out</button>
                </div>
            </div>

            {/* Visitors Table */}
            <div className="section-card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Visitor Name</th>
                                <th>Purpose</th>
                                <th>Person to Meet</th>
                                <th>Phone</th>
                                <th>Check-in Time</th>
                                <th>Duration</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visitors.map(visitor => {
                                const statusColor = getStatusColor(visitor.status);
                                return (
                                    <tr key={visitor._id}>
                                        <td><strong>{visitor.visitorName}</strong></td>
                                        <td>{visitor.purpose}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{visitor.personToMeet || '-'}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{visitor.phone || '-'}</td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {new Date(visitor.checkInTime || visitor.createdAt).toLocaleString()}
                                        </td>
                                        <td style={{ fontWeight: visitor.status === 'open' ? 600 : 400 }}>
                                            {formatDuration(visitor.checkInTime || visitor.createdAt, visitor.checkOutTime)}
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
                                                {visitor.status === 'open' ? 'Inside' : 'Checked Out'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {visitor.status === 'open' && (
                                                    <button
                                                        onClick={() => handleCheckout(visitor._id)}
                                                        className="btn btn-primary"
                                                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                    >
                                                        <FiLogOut /> Check Out
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(visitor._id)}
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
                            {visitors.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: 40 }}>
                                        No visitor records found
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

export default ReceptionistVisitors;