import React, { useState, useEffect, useCallback } from 'react';
import { FiBookOpen, FiCornerDownLeft, FiCornerUpRight, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const LibrarianIssueReturn = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('issued');
    const [showIssueForm, setShowIssueForm] = useState(false);
    const [formData, setFormData] = useState({ bookId: '', studentId: '', issueDate: '', dueDate: '' });
    const [books, setBooks] = useState([]);
    const [students, setStudents] = useState([]);

    const fetchIssues = useCallback(async () => {
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/library/issues', { params });
            if (res.data.success) setIssues(res.data.data);
        } catch (error) { console.error('Error:', error); }
        setLoading(false);
    }, [statusFilter]);

    useEffect(() => { fetchIssues(); }, [fetchIssues]);

    const fetchBooksAndStudents = async () => {
        setFormLoading(true);
        try {
            const [booksRes, studentsRes] = await Promise.all([
                api.get('/library/books'),
                api.get('/library/eligible-users'),
            ]);
            if (booksRes.data.success) setBooks(booksRes.data.data.filter(b => b.availableCopies > 0));
            if (studentsRes.data.success) setStudents(studentsRes.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load books or students');
        }
        setFormLoading(false);
    };

    const handleIssue = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                issueDate: formData.issueDate || defaultIssueDate,
                dueDate: formData.dueDate || defaultDueDate,
            };
            const res = await api.post('/library/issue', payload);
            if (res.data.success) {
                toast.success(res.data.message);
                setShowIssueForm(false);
                setFormData({ bookId: '', studentId: '', issueDate: '', dueDate: '' });
                fetchIssues();
            }
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to issue book'); }
    };

    const handleReturn = async (issueId) => {
        try {
            const res = await api.put(`/library/return/${issueId}`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchIssues();
            }
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to return book'); }
    };

    const handleDelete = async (issueId) => {
        if (!window.confirm('Are you sure you want to delete this issue record? This will also return the book copy if not already returned.')) return;
        try {
            const res = await api.delete(`/library/issue/${issueId}`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchIssues();
            }
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to delete issue record'); }
    };

    const openIssueForm = async () => {
        setFormData((prev) => ({
            ...prev,
            issueDate: prev.issueDate || defaultIssueDate,
            dueDate: prev.dueDate || defaultDueDate,
        }));
        await fetchBooksAndStudents();
        setShowIssueForm(true);
    };

    // Default dates
    const defaultIssueDate = new Date().toISOString().split('T')[0];
    const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1><FiBookOpen style={{ marginRight: 8 }} /> Issue / Return Books</h1>
                    <p>Manage book issuing and returns</p>
                </div>
                <button className="btn btn-primary" onClick={openIssueForm}>
                    <FiCornerUpRight /> Issue Book
                </button>
            </div>

            {/* Filter */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-4)' }}>
                <div style={{ padding: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-2)' }}>
                    {['issued', 'returned', 'overdue', ''].map(s => (
                        <button key={s || 'all'} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setStatusFilter(s)}>
                            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Issue Form */}
            {showIssueForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)',
                        padding: 'var(--spacing-6)', width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-xl)',
                    }}>
                        <h2 style={{ marginBottom: 'var(--spacing-4)' }}>Issue Book</h2>
                        {formLoading ? (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-6)' }}>
                                <div className="spinner" style={{ margin: '0 auto' }}></div>
                                <p style={{ marginTop: 'var(--spacing-3)', color: 'var(--text-muted)' }}>Loading books and students...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleIssue}>
                                <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
                                    <div>
                                        <label className="form-label">Select Book *</label>
                                        <select className="form-input" required value={formData.bookId}
                                            onChange={e => setFormData({ ...formData, bookId: e.target.value })}
                                            disabled={books.length === 0}>
                                            <option value="">{books.length === 0 ? '-- No books available --' : '-- Select Book --'}</option>
                                            {books.map(b => <option key={b._id} value={b._id}>{b.title} - {b.author} ({b.availableCopies} available)</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Select Student *</label>
                                        <select className="form-input" required value={formData.studentId}
                                            onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                                            disabled={students.length === 0}>
                                            <option value="">{students.length === 0 ? '-- No students found --' : '-- Select Student --'}</option>
                                            {students.map(s => (
                                                <option key={s._id || s.user?._id} value={s.user?._id || s._id}>
                                                    {s.user?.firstName || s.firstName} {s.user?.lastName || s.lastName} - {s.user?.email || s.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Issue Date</label>
                                        <input className="form-input" type="date" value={formData.issueDate || defaultIssueDate}
                                            onChange={e => setFormData({ ...formData, issueDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="form-label">Due Date</label>
                                        <input className="form-input" type="date" value={formData.dueDate || defaultDueDate}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowIssueForm(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={formLoading || books.length === 0 || students.length === 0}>Issue Book</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Issues Table */}
            <div className="section-card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr><th>Book</th><th>Student</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Fine</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {issues.map(issue => (
                                <tr key={issue._id}>
                                    <td><strong>{issue.book?.title}</strong></td>
                                    <td>{issue.student?.firstName} {issue.student?.lastName}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{new Date(issue.issueDate).toLocaleDateString()}</td>
                                    <td style={{ color: new Date(issue.dueDate) < new Date() && issue.status === 'issued' ? '#e74c3c' : 'var(--text-muted)' }}>
                                        {new Date(issue.dueDate).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                                            background: issue.status === 'issued' ? '#fff3e0' : issue.status === 'returned' ? '#e8f5e9' : '#fce4ec',
                                            color: issue.status === 'issued' ? '#e65100' : issue.status === 'returned' ? '#2e7d32' : '#c62828',
                                        }}>
                                            {issue.status}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: issue.fine > 0 ? 600 : 400, color: issue.fine > 0 ? '#e74c3c' : 'var(--text-muted)' }}>
                                        {issue.fine > 0 ? `₹${issue.fine}` : '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                            {issue.status === 'issued' && (
                                                <button onClick={() => handleReturn(issue._id)} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <FiCornerDownLeft /> Return
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(issue._id)} className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <FiTrash2 /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {issues.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}>No records found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LibrarianIssueReturn;
