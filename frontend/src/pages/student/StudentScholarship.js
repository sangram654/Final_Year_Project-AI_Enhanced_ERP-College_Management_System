import React, { useState, useEffect, useCallback } from 'react';
import { FiAward, FiCalendar, FiFileText, FiCheck, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { scholarshipService } from '../../services/api';
import './StudentPages.css';

const StudentScholarship = () => {
    const [loading, setLoading] = useState(true);
    const [scholarships, setScholarships] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [activeTab, setActiveTab] = useState('available');

    const fetchData = useCallback(async () => {
        try {
            const [scholarshipsRes, applicationsRes] = await Promise.all([
                scholarshipService.getAll(),
                scholarshipService.getMyApplications(),
            ]);
            setScholarships(scholarshipsRes.data.data || []);
            setMyApplications(applicationsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching scholarship data:', error);
            setScholarships([]);
            setMyApplications([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApply = async (scholarshipId) => {
        try {
            await scholarshipService.apply(scholarshipId, {});
            toast.success('Application submitted successfully!');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to apply');
        }
    };

    const isApplied = (scholarshipId) => {
        return myApplications.some(app => app.scholarship?._id === scholarshipId);
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Approved': return 'badge-success';
            case 'Rejected': return 'badge-error';
            default: return 'badge-warning';
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
                    <h1>Scholarships</h1>
                    <p>View and apply for available scholarships</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 'var(--spacing-6)' }}>
                <button
                    className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
                    onClick={() => setActiveTab('available')}
                >
                    Available Scholarships ({scholarships.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'applied' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applied')}
                >
                    My Applications ({myApplications.length})
                </button>
            </div>

            {/* Available Scholarships */}
            {activeTab === 'available' && (
                <div className="fee-cards-grid">
                    {scholarships.map((scholarship) => (
                        <div key={scholarship._id} className="fee-card">
                            <div className="fee-card-header">
                                <div>
                                    <h3>{scholarship.name}</h3>
                                    <p>{scholarship.type} Scholarship</p>
                                </div>
                                <span className="badge badge-primary">
                                    ₹{scholarship.amount?.toLocaleString()}
                                </span>
                            </div>
                            <div className="fee-card-body">
                                <p style={{ marginBottom: 'var(--spacing-4)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                    {scholarship.description}
                                </p>
                                <div className="fee-amount-row">
                                    <span><FiCalendar /> Deadline</span>
                                    <span>{new Date(scholarship.deadline).toLocaleDateString()}</span>
                                </div>
                                {scholarship.eligibility?.minPercentage && (
                                    <div className="fee-amount-row">
                                        <span>Min. Percentage</span>
                                        <span>{scholarship.eligibility.minPercentage}%</span>
                                    </div>
                                )}
                                <div style={{ marginTop: 'var(--spacing-3)' }}>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--spacing-1)' }}>Required Documents:</p>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap' }}>
                                        {scholarship.documentsRequired?.map((doc, i) => (
                                            <span key={i} className="badge badge-info" style={{ fontSize: 'var(--text-xs)' }}>
                                                <FiFileText size={10} /> {doc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="fee-card-footer">
                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                                    {scholarship.academicYear}
                                </span>
                                {isApplied(scholarship._id) ? (
                                    <span className="badge badge-success">
                                        <FiCheck /> Applied
                                    </span>
                                ) : (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleApply(scholarship._id)}
                                    >
                                        Apply Now
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* My Applications */}
            {activeTab === 'applied' && (
                <div className="section-card">
                    <div className="section-header">
                        <h2>Application History</h2>
                    </div>
                    {myApplications.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Scholarship</th>
                                        <th>Amount</th>
                                        <th>Applied On</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myApplications.map((app) => (
                                        <tr key={app._id}>
                                            <td><strong>{app.scholarship?.name}</strong></td>
                                            <td>₹{app.scholarship?.amount?.toLocaleString()}</td>
                                            <td>{new Date(app.appliedOn || app.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`badge ${getStatusClass(app.status)}`}>
                                                    {app.status === 'Pending' ? <FiClock /> : <FiCheck />} {app.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <FiAward size={48} />
                            <h3>No applications yet</h3>
                            <p>Apply for scholarships from the "Available Scholarships" tab</p>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
        .tabs {
          display: flex;
          gap: var(--spacing-2);
          background: white;
          padding: var(--spacing-2);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }
        .tab-btn {
          flex: 1;
          padding: var(--spacing-3) var(--spacing-4);
          border: none;
          background: transparent;
          border-radius: var(--radius-md);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--text-secondary);
        }
        .tab-btn:hover {
          background: var(--bg-secondary);
        }
        .tab-btn.active {
          background: var(--primary-500);
          color: white;
        }
      `}</style>
        </div>
    );
};

export default StudentScholarship;
