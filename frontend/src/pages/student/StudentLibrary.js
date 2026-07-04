import React, { useState, useEffect, useCallback } from 'react';
import { 
    FiBook, FiSearch, FiClock, FiAlertCircle, FiCheckCircle, 
    FiCalendar, FiMapPin, FiUser, FiFilter, FiGrid, FiList
} from 'react-icons/fi';
import api from '../../services/api';
import './StudentPages.css';

const StudentLibrary = () => {
    const [activeTab, setActiveTab] = useState('borrowed'); // 'borrowed' or 'browse'
    const [loading, setLoading] = useState(true);
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [availableBooks, setAvailableBooks] = useState([]);
    const [summary, setSummary] = useState({
        currentlyBorrowed: 0,
        totalBorrowed: 0,
        overdue: 0,
        unpaidFines: 0,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const fetchMyBooks = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            
            const res = await api.get('/library/my-books', { params });
            setBorrowedBooks(res.data.data || []);
            setSummary(res.data.summary || {});
        } catch (error) {
            console.error('Error fetching borrowed books:', error);
            setBorrowedBooks([]);
        }
        setLoading(false);
    }, [statusFilter]);

    const fetchAvailableBooks = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (searchQuery) params.search = searchQuery;
            if (categoryFilter) params.category = categoryFilter;
            
            const res = await api.get('/library/browse', { params });
            setAvailableBooks(res.data.data || []);
            setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (error) {
            console.error('Error fetching available books:', error);
            setAvailableBooks([]);
        }
        setLoading(false);
    }, [searchQuery, categoryFilter]);

    useEffect(() => {
        if (activeTab === 'borrowed') {
            fetchMyBooks();
        } else {
            fetchAvailableBooks();
        }
    }, [activeTab, fetchMyBooks, fetchAvailableBooks]);

    const getDaysRemaining = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getStatusBadge = (issue) => {
        if (issue.status === 'returned') {
            return <span className="badge badge-success"><FiCheckCircle /> Returned</span>;
        }
        const daysRemaining = getDaysRemaining(issue.dueDate);
        if (daysRemaining < 0) {
            return <span className="badge badge-error"><FiAlertCircle /> Overdue by {Math.abs(daysRemaining)} days</span>;
        } else if (daysRemaining <= 3) {
            return <span className="badge badge-warning"><FiClock /> Due in {daysRemaining} days</span>;
        }
        return <span className="badge badge-info"><FiClock /> {daysRemaining} days left</span>;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const categories = ['Textbook', 'Reference', 'Magazine', 'Journal', 'Fiction', 'Non-Fiction', 'Research Paper'];

    if (loading && borrowedBooks.length === 0 && availableBooks.length === 0) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
                <p>Loading library...</p>
            </div>
        );
    }

    return (
        <div className="student-page animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Library</h1>
                    <p>Browse books and manage your borrowed items</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div className="summary-card">
                    <div className="summary-icon total">
                        <FiBook />
                    </div>
                    <div className="summary-content">
                        <h3>{summary.currentlyBorrowed}</h3>
                        <p>Currently Borrowed</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon present">
                        <FiCheckCircle />
                    </div>
                    <div className="summary-content">
                        <h3>{summary.totalBorrowed}</h3>
                        <p>Total Borrowed</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon absent">
                        <FiAlertCircle />
                    </div>
                    <div className="summary-content">
                        <h3>{summary.overdue}</h3>
                        <p>Overdue</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon percentage">
                        <FiClock />
                    </div>
                    <div className="summary-content">
                        <h3>₹{summary.unpaidFines || 0}</h3>
                        <p>Pending Fines</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                    <button
                        onClick={() => setActiveTab('borrowed')}
                        style={{
                            padding: 'var(--spacing-4) var(--spacing-6)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            color: activeTab === 'borrowed' ? 'var(--primary-color)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'borrowed' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-2)'
                        }}
                    >
                        <FiBook /> My Borrowed Books ({summary.currentlyBorrowed})
                    </button>
                    <button
                        onClick={() => setActiveTab('browse')}
                        style={{
                            padding: 'var(--spacing-4) var(--spacing-6)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            color: activeTab === 'browse' ? 'var(--primary-color)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'browse' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-2)'
                        }}
                    >
                        <FiSearch /> Browse Library
                    </button>
                </div>
            </div>

            {/* Borrowed Books Tab */}
            {activeTab === 'borrowed' && (
                <>
                    {/* Filter */}
                    <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <div style={{ padding: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-4)' }}>
                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ maxWidth: '200px' }}
                            >
                                <option value="">All Status</option>
                                <option value="issued">Currently Borrowed</option>
                                <option value="returned">Returned</option>
                            </select>
                        </div>
                    </div>

                    {/* Borrowed Books List */}
                    {borrowedBooks.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                            {borrowedBooks.map((issue) => (
                                <div 
                                    key={issue._id} 
                                    className="section-card"
                                    style={{ 
                                        borderLeft: issue.status === 'returned' 
                                            ? '4px solid var(--success-color)' 
                                            : getDaysRemaining(issue.dueDate) < 0 
                                                ? '4px solid var(--error-color)'
                                                : '4px solid var(--primary-color)'
                                    }}
                                >
                                    <div style={{ padding: 'var(--spacing-5)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                                            <div style={{ flex: 1, minWidth: '250px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>
                                                    <span style={{ fontSize: '2rem' }}>📚</span>
                                                    <div>
                                                        <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{issue.book?.title}</h3>
                                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                            by {issue.book?.author}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-3)', fontSize: '0.875rem' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', color: 'var(--text-muted)' }}>
                                                        <FiBook /> ISBN: {issue.book?.isbn || 'N/A'}
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', color: 'var(--text-muted)' }}>
                                                        <FiMapPin /> {issue.book?.shelfLocation || 'N/A'}
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', color: 'var(--text-muted)' }}>
                                                        <FiUser /> Issued by: {issue.issuedBy?.firstName} {issue.issuedBy?.lastName}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', minWidth: '180px' }}>
                                                {getStatusBadge(issue)}
                                                <div style={{ marginTop: 'var(--spacing-3)', fontSize: '0.875rem' }}>
                                                    <p style={{ margin: 'var(--spacing-1) 0', color: 'var(--text-muted)' }}>
                                                        <FiCalendar style={{ marginRight: 4 }} />
                                                        Issued: {formatDate(issue.issueDate || issue.createdAt)}
                                                    </p>
                                                    <p style={{ margin: 'var(--spacing-1) 0', fontWeight: 500 }}>
                                                        <FiClock style={{ marginRight: 4 }} />
                                                        Due: {formatDate(issue.dueDate)}
                                                    </p>
                                                    {issue.returnDate && (
                                                        <p style={{ margin: 'var(--spacing-1) 0', color: 'var(--success-color)' }}>
                                                            Returned: {formatDate(issue.returnDate)}
                                                        </p>
                                                    )}
                                                    {issue.fine > 0 && (
                                                        <p style={{ margin: 'var(--spacing-1) 0', color: 'var(--error-color)', fontWeight: 500 }}>
                                                            Fine: ₹{issue.fine} {issue.finePaid ? '(Paid)' : '(Unpaid)'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="section-card">
                            <div className="empty-state" style={{ padding: 'var(--spacing-12)' }}>
                                <FiBook size={48} />
                                <h3>No Borrowed Books</h3>
                                <p>You haven't borrowed any books yet. Visit the library to borrow books!</p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Browse Books Tab */}
            {activeTab === 'browse' && (
                <>
                    {/* Search & Filter */}
                    <div className="section-card" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <div style={{ padding: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by title, author, or ISBN..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && fetchAvailableBooks()}
                                    style={{ paddingLeft: 40 }}
                                />
                            </div>
                            <select
                                className="form-select"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                style={{ maxWidth: '200px' }}
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <button className="btn btn-primary" onClick={() => fetchAvailableBooks()}>
                                <FiSearch /> Search
                            </button>
                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                <button 
                                    className={`btn btn-secondary btn-sm ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                    style={{ background: viewMode === 'grid' ? 'var(--primary-color)' : '', color: viewMode === 'grid' ? 'white' : '' }}
                                >
                                    <FiGrid />
                                </button>
                                <button 
                                    className={`btn btn-secondary btn-sm ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                    style={{ background: viewMode === 'list' ? 'var(--primary-color)' : '', color: viewMode === 'list' ? 'white' : '' }}
                                >
                                    <FiList />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Books Grid/List */}
                    {availableBooks.length > 0 ? (
                        <>
                            <div className={viewMode === 'grid' ? 'materials-grid' : ''} style={viewMode === 'list' ? { display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' } : {}}>
                                {availableBooks.map((book) => (
                                    <div key={book._id} className="section-card" style={{ padding: 'var(--spacing-4)' }}>
                                        <div style={viewMode === 'list' ? { display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' } : {}}>
                                            <div style={{ fontSize: '2.5rem', marginBottom: viewMode === 'grid' ? 'var(--spacing-3)' : 0 }}>
                                                📖
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: '0 0 var(--spacing-1)', fontSize: '1rem' }}>{book.title}</h3>
                                                <p style={{ margin: '0 0 var(--spacing-2)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                    by {book.author}
                                                </p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                                                    <span className="badge badge-info">{book.category}</span>
                                                    <span className="badge badge-success">
                                                        {book.availableCopies} of {book.totalCopies} available
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    <FiMapPin style={{ marginRight: 4 }} /> {book.shelfLocation || 'Location N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div style={{ marginTop: 'var(--spacing-6)', display: 'flex', justifyContent: 'center', gap: 'var(--spacing-2)' }}>
                                    <button 
                                        className="btn btn-secondary btn-sm"
                                        disabled={pagination.page <= 1}
                                        onClick={() => fetchAvailableBooks(pagination.page - 1)}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ padding: 'var(--spacing-2) var(--spacing-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                        Page {pagination.page} of {pagination.pages}
                                    </span>
                                    <button 
                                        className="btn btn-secondary btn-sm"
                                        disabled={pagination.page >= pagination.pages}
                                        onClick={() => fetchAvailableBooks(pagination.page + 1)}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="section-card">
                            <div className="empty-state" style={{ padding: 'var(--spacing-12)' }}>
                                <FiSearch size={48} />
                                <h3>No Books Found</h3>
                                <p>Try adjusting your search or filters</p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Info Note */}
            <div className="section-card" style={{ marginTop: 'var(--spacing-6)', background: 'var(--info-bg)', borderLeft: '4px solid var(--info-color)' }}>
                <div style={{ padding: 'var(--spacing-4)' }}>
                    <h4 style={{ margin: '0 0 var(--spacing-2)', color: 'var(--info-color)' }}>📚 Library Rules</h4>
                    <ul style={{ margin: 0, paddingLeft: 'var(--spacing-5)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        <li>Maximum 3 books can be borrowed at a time</li>
                        <li>Books must be returned within 14 days</li>
                        <li>Late return fine: ₹5 per day</li>
                        <li>Visit the library counter to borrow books</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StudentLibrary;
