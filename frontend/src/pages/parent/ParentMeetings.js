import React, { useState, useEffect } from 'react';
import { FiVideo, FiCalendar, FiClock, FiExternalLink, FiUsers, FiPlay } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { meetingService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ParentMeetings = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [meetings, setMeetings] = useState([]);
    const [filter, setFilter] = useState('upcoming');

    useEffect(() => {
        fetchMeetings();
    }, [profile]);

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const res = await meetingService.getUpcoming();
            setMeetings(res.data.data || []);
        } catch (error) {
            console.error('Error fetching meetings:', error);
            toast.error('Failed to load meetings');
        }
        setLoading(false);
    };

    const handleJoinMeeting = async (meetingId, meetingLink) => {
        try {
            const res = await meetingService.join(meetingId);
            window.open(meetingLink, '_blank');
            toast.success(res.data.message || 'Joined meeting successfully');
            fetchMeetings();
        } catch (error) {
            console.error('Error joining meeting:', error);
            toast.error(error.response?.data?.message || 'Failed to join meeting');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            'Scheduled': 'primary',
            'Ongoing': 'success',
            'Completed': 'secondary',
            'Cancelled': 'error'
        };
        return colors[status] || 'secondary';
    };

    const isToday = (date) => {
        const today = new Date();
        const meetingDate = new Date(date);
        return today.toDateString() === meetingDate.toDateString();
    };

    const isMeetingTime = (meeting) => {
        const now = new Date();
        const meetingDateTime = new Date(`${meeting.scheduledDate.split('T')[0]}T${meeting.scheduledTime}`);
        const endTime = new Date(meetingDateTime.getTime() + meeting.duration * 60000);
        return now >= meetingDateTime && now <= endTime;
    };

    const filteredMeetings = meetings.filter(meeting => {
        if (filter === 'today') {
            return isToday(meeting.scheduledDate);
        } else if (filter === 'upcoming') {
            return meeting.status === 'Scheduled' || meeting.status === 'Ongoing';
        }
        return true;
    });

    const todayMeetings = meetings.filter(m => isToday(m.scheduledDate) && (m.status === 'Scheduled' || m.status === 'Ongoing'));
    const upcomingMeetings = meetings.filter(m => !isToday(m.scheduledDate) && (m.status === 'Scheduled' || m.status === 'Ongoing'));

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading meetings...</p>
            </div>
        );
    }

    return (
        <div className="parent-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1><FiVideo /> Parent-Teacher Meetings</h1>
                    <p>View and join scheduled meetings with teachers</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="summary-card">
                    <div className="summary-icon total">
                        <FiVideo />
                    </div>
                    <div className="summary-content">
                        <h3>{meetings.length}</h3>
                        <p>Total Meetings</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon present">
                        <FiCalendar />
                    </div>
                    <div className="summary-content">
                        <h3>{todayMeetings.length}</h3>
                        <p>Today's Meetings</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon percentage">
                        <FiClock />
                    </div>
                    <div className="summary-content">
                        <h3>{upcomingMeetings.length}</h3>
                        <p>Upcoming</p>
                    </div>
                </div>
            </div>

            {/* Today's Meetings - Highlighted */}
            {todayMeetings.length > 0 && (
                <div className="section-card" style={{ marginBottom: 'var(--spacing-6)', background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary-color) 100%)', border: '2px solid var(--primary-color)' }}>
                    <div className="section-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                        <h2 style={{ color: 'white' }}>📅 Today's Meetings</h2>
                    </div>
                    <div style={{ padding: 'var(--spacing-4)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-4)' }}>
                        {todayMeetings.map((meeting) => (
                            <div key={meeting._id} style={{ 
                                background: 'white', 
                                borderRadius: 'var(--radius-lg)', 
                                padding: 'var(--spacing-4)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-3)' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-color)' }}>{meeting.title}</h3>
                                    {isMeetingTime(meeting) && (
                                        <span className="badge badge-success" style={{ animation: 'pulse 2s infinite' }}>
                                            🔴 Live
                                        </span>
                                    )}
                                </div>

                                {meeting.subject && (
                                    <div style={{ marginBottom: 'var(--spacing-3)' }}>
                                        <span className="badge badge-secondary">
                                            {meeting.subject.code} - {meeting.subject.name}
                                        </span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                        <FiClock size={16} color="var(--primary-color)" />
                                        <span style={{ fontWeight: '600' }}>{meeting.scheduledTime} ({meeting.duration} min)</span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                        <FiVideo size={16} />
                                        <span>{meeting.platform}</span>
                                    </div>

                                    {meeting.host && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                            <FiUsers size={16} />
                                            <span>Host: {meeting.host.user?.firstName} {meeting.host.user?.lastName}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                    onClick={() => handleJoinMeeting(meeting._id, meeting.meetingLink)}
                                >
                                    <FiPlay /> Join Meeting
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
                <button
                    className={`btn ${filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('upcoming')}
                >
                    Upcoming
                </button>
                <button
                    className={`btn ${filter === 'today' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('today')}
                >
                    Today
                </button>
                <button
                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
            </div>

            {/* All Meetings List */}
            <div className="section-card">
                <div className="section-header">
                    <h2>
                        {filter === 'today' && 'Today\'s Meetings'}
                        {filter === 'upcoming' && 'Upcoming Meetings'}
                        {filter === 'all' && 'All Meetings'}
                    </h2>
                    <span className="record-count">{filteredMeetings.length} meetings</span>
                </div>

                {filteredMeetings.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Meeting</th>
                                    <th>Subject</th>
                                    <th>Date & Time</th>
                                    <th>Duration</th>
                                    <th>Platform</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMeetings.map((meeting) => (
                                    <tr key={meeting._id}>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{meeting.title}</div>
                                            {meeting.description && (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {meeting.description.substring(0, 50)}...
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {meeting.subject ? (
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>{meeting.subject.name}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        {meeting.subject.code}
                                                    </div>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <div>{new Date(meeting.scheduledDate).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {meeting.scheduledTime}
                                            </div>
                                        </td>
                                        <td>{meeting.duration} min</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FiVideo size={14} />
                                                {meeting.platform}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${getStatusBadge(meeting.status)}`}>
                                                {meeting.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleJoinMeeting(meeting._id, meeting.meetingLink)}
                                                disabled={meeting.status === 'Cancelled' || meeting.status === 'Completed'}
                                            >
                                                {meeting.status === 'Ongoing' ? (
                                                    <><FiPlay /> Join</>
                                                ) : (
                                                    <><FiExternalLink /> Link</>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <FiVideo size={48} />
                        <h3>No Meetings</h3>
                        <p>
                            {filter === 'today' && 'No meetings scheduled for today'}
                            {filter === 'upcoming' && 'No upcoming meetings'}
                            {filter === 'all' && 'No meetings available'}
                        </p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default ParentMeetings;
