import React from 'react';
import {
    FiBell, FiAlertTriangle, FiClock, FiUser,
    FiCalendar, FiEye, FiDownload, FiExternalLink, FiTrash2
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './NoticeCard.css';

const parseDate = (d) => {
    if (!d) return null;
    if (typeof d === 'string') {
        if (!d.endsWith('Z') && !d.includes('+') && !d.slice(10).includes('-')) {
            return new Date(d + 'Z');
        }
    }
    return new Date(d);
};

const NoticeCard = ({ notice, onRead, onDelete, onClick, className = '' }) => {
    const { user } = useAuth();
    const pubDate = parseDate(notice.publishDate) || new Date();
    const expDate = parseDate(notice.expiryDate);
    const isExpired = expDate && expDate < new Date();

    // Check if the notice was created by a super admin
    const isCreatedBySuperAdmin = 
        (notice.creator?.role === 'super_admin' || notice.creator?.role === 'superadmin' ||
         notice.createdBy?.role === 'super_admin' || notice.createdBy?.role === 'superadmin');

    // Super Admin notices can only be deleted by Super Admin
    const canDeleteNotice = onDelete && (!isCreatedBySuperAdmin || user?.role === 'super_admin' || user?.role === 'superadmin');

    const formatIST = (dateObj) => {
        if (!dateObj || isNaN(dateObj.getTime())) return '';
        return dateObj.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateString) => {
        const date = parseDate(dateString) || new Date();
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        return date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'urgent':
                return <FiAlertTriangle className="text-red-500" />;
            case 'high':
                return <FiAlertTriangle className="text-orange-500" />;
            case 'medium':
                return <FiBell className="text-blue-500" />;
            case 'low':
            default:
                return <FiBell className="text-gray-500" />;
        }
    };

    const getPriorityClass = (priority) => {
        const baseClass = 'notice-card';
        switch (priority) {
            case 'urgent':
                return `${baseClass} notice-urgent`;
            case 'high':
                return `${baseClass} notice-high`;
            case 'medium':
                return `${baseClass} notice-medium`;
            case 'low':
            default:
                return `${baseClass} notice-low`;
        }
    };

    const getTypeLabel = (type) => {
        const typeLabels = {
            announcement: 'Announcement',
            urgent: 'Urgent',
            academic: 'Academic',
            administrative: 'Administrative',
            event: 'Event',
            exam: 'Exam',
            general: 'General'
        };
        return typeLabels[type] || 'Notice';
    };

    const handleCardClick = () => {
        if (!notice.isRead && onRead) {
            onRead(notice._id);
        }
        if (onClick) {
            onClick(notice);
        }
    };

    const handleMarkAsRead = (e) => {
        e.stopPropagation();
        if (onRead) {
            onRead(notice._id);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(notice._id);
        }
    };

    return (
        <div
            className={`${getPriorityClass(notice.priority)} ${!notice.isRead ? 'unread' : 'read'} ${className}`}
            onClick={handleCardClick}
        >
            {/* Priority indicator */}
            <div className="notice-priority-indicator">
                {getPriorityIcon(notice.priority)}
            </div>

            {/* Header */}
            <div className="notice-header">
                <div className="notice-meta">
                    <span className={`notice-type notice-type-${notice.type}`}>
                        {getTypeLabel(notice.type)}
                    </span>
                    <span className={`notice-priority notice-priority-${notice.priority}`}>
                        {notice.priority.toUpperCase()}
                    </span>
                </div>

                <div className="notice-date" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem' }}>
                        <div><FiCalendar className="date-icon" /> <strong>Start:</strong> {formatIST(pubDate)}</div>
                        {expDate && (
                            <div style={{ color: isExpired ? '#dc2626' : 'inherit' }}>
                                <FiClock className="date-icon" /> <strong>End:</strong> {formatIST(expDate)}
                            </div>
                        )}
                    </div>
                    {canDeleteNotice && (
                        <button
                            className="action-btn delete-btn"
                            onClick={handleDeleteClick}
                            title="Delete Notice"
                            style={{
                                backgroundColor: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                width: '32px',
                                height: '32px',
                                minWidth: '32px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                                flexShrink: 0
                            }}
                        >
                            <FiTrash2 style={{ fontSize: '1.1rem' }} />
                        </button>
                    )}
                </div>
            </div>

            {/* Title */}
            <h3 className="notice-title">
                {notice.title}
                {!notice.isRead && <span className="unread-indicator"></span>}
            </h3>

            {/* Content preview */}
            <div className="notice-content">
                <p>
                    {notice.content.length > 150
                        ? `${notice.content.substring(0, 150)}...`
                        : notice.content
                    }
                </p>
            </div>

            {/* Attachments */}
            {notice.attachments && notice.attachments.length > 0 && (
                <div className="notice-attachments">
                    <FiDownload className="attachment-icon" />
                    <span>{notice.attachments.length} attachment{notice.attachments.length > 1 ? 's' : ''}</span>
                </div>
            )}

            {/* Footer */}
            <div className="notice-footer">
                {/* Creator info */}
                <div className="notice-creator">
                    <FiUser className="creator-icon" />
                    <span>
                        {notice.creator
                            ? `${notice.creator.firstName || ''} ${notice.creator.lastName || ''}`.trim()
                            : typeof notice.createdBy === 'object' && notice.createdBy
                            ? `${notice.createdBy.firstName || ''} ${notice.createdBy.lastName || ''}`.trim()
                            : 'Admin'
                        }
                    </span>
                </div>

                {/* Action buttons & Expired status */}
                <div className="notice-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isExpired && (
                        <div className="expiry-warning" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5', margin: 0, padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FiClock className="expiry-icon" />
                            <span>Expired</span>
                        </div>
                    )}

                    {canDeleteNotice && (
                        <button
                            className="action-btn delete-btn"
                            onClick={handleDeleteClick}
                            title="Delete notice"
                            style={{
                                backgroundColor: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                width: '32px',
                                height: '32px',
                                minWidth: '32px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                                flexShrink: 0
                            }}
                        >
                            <FiTrash2 style={{ fontSize: '1.1rem' }} />
                        </button>
                    )}

                    {!notice.isRead && (
                        <button
                            className="action-btn mark-read-btn"
                            onClick={handleMarkAsRead}
                            title="Mark as read"
                        >
                            <FiEye />
                        </button>
                    )}

                    <button
                        className="action-btn view-btn"
                        onClick={handleCardClick}
                        title="View full notice"
                    >
                        <FiExternalLink />
                    </button>
                </div>
            </div>

            {/* Read status indicator */}
            <div className={`read-status ${notice.isRead ? 'read' : 'unread'}`}>
                <div className="read-dot"></div>
            </div>
        </div>
    );
};

export default NoticeCard;