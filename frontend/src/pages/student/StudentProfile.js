import React, { useState } from 'react';
import { FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiCamera } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './StudentPages.css';

const StudentProfile = () => {
    const { user, profile, updateProfile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        address: {
            street: user?.address?.street || '',
            city: user?.address?.city || '',
            state: user?.address?.state || '',
            pincode: user?.address?.pincode || '',
        },
    });

    const handleSave = async () => {
        const result = await updateProfile(formData);
        if (result.success) {
            toast.success('Profile updated successfully');
            setEditing(false);
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>My Profile</h1>
                    <p>View and manage your personal information</p>
                </div>
                <button
                    className={`btn ${editing ? 'btn-success' : 'btn-primary'}`}
                    onClick={() => editing ? handleSave() : setEditing(true)}
                >
                    {editing ? <><FiSave /> Save Changes</> : <><FiEdit2 /> Edit Profile</>}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--spacing-6)' }}>
                {/* Profile Card */}
                <div className="section-card">
                    <div style={{ padding: 'var(--spacing-8)', textAlign: 'center' }}>
                        <div style={{
                            width: 120,
                            height: 120,
                            margin: '0 auto var(--spacing-4)',
                            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 'var(--text-4xl)',
                            fontWeight: 700,
                            position: 'relative',
                        }}>
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                            <button style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 32,
                                height: 32,
                                background: 'white',
                                border: '2px solid var(--primary-500)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--primary-500)',
                            }}>
                                <FiCamera size={14} />
                            </button>
                        </div>
                        <h2 style={{ marginBottom: 'var(--spacing-1)' }}>{user?.firstName} {user?.lastName}</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-4)' }}>
                            {profile?.rollNumber || user?.email}
                        </p>
                        <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                            {user?.role}
                        </span>
                    </div>

                    {profile && (
                        <div style={{ borderTop: '1px solid var(--border-color)', padding: 'var(--spacing-5)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Department</span>
                                <span style={{ fontWeight: 500 }}>{profile.department || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Semester</span>
                                <span style={{ fontWeight: 500 }}>{profile.semester || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Batch</span>
                                <span style={{ fontWeight: 500 }}>{profile.batch || 'N/A'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Form */}
                <div className="section-card">
                    <div className="section-header">
                        <h2>Personal Information</h2>
                    </div>
                    <div style={{ padding: 'var(--spacing-6)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-5)' }}>
                            <div className="form-group">
                                <label className="form-label"><FiUser style={{ marginRight: 4 }} /> First Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    disabled={!editing}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><FiUser style={{ marginRight: 4 }} /> Last Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    disabled={!editing}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><FiMail style={{ marginRight: 4 }} /> Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={user?.email || ''}
                                    disabled
                                    style={{ background: 'var(--bg-secondary)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label"><FiPhone style={{ marginRight: 4 }} /> Phone Number</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={!editing}
                                />
                            </div>
                        </div>

                        <h3 style={{ marginTop: 'var(--spacing-6)', marginBottom: 'var(--spacing-4)' }}>Address</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-5)' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Street Address</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.address.street}
                                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                    disabled={!editing}
                                    placeholder="Enter your street address"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.address.city}
                                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                    disabled={!editing}
                                    placeholder="City"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">State</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.address.state}
                                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                    disabled={!editing}
                                    placeholder="State"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">PIN Code</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.address.pincode}
                                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
                                    disabled={!editing}
                                    placeholder="PIN Code"
                                />
                            </div>
                        </div>

                        {editing && (
                            <div style={{ marginTop: 'var(--spacing-6)', display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave}><FiSave /> Save Changes</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
