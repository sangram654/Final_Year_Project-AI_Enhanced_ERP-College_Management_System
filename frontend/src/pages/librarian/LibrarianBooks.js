import React, { useState, useEffect, useCallback } from 'react';
import { FiBook, FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';

const LibrarianBooks = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [formData, setFormData] = useState({
        title: '', author: '', isbn: '', publisher: '', category: 'Textbook',
        department: 'General', totalCopies: 1, shelfLocation: '',
    });

    const categories = ['Textbook', 'Reference', 'Journal', 'Magazine', 'Novel', 'Biography', 'Other'];
    const departments = ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Information Technology', 'Artificial Intelligence and Machine Learning', 'General'];

    const fetchBooks = useCallback(async () => {
        try {
            const params = {};
            if (search) params.search = search;
            const res = await api.get('/library/books', { params });
            if (res.data.success) setBooks(res.data.data);
        } catch (error) { console.error('Error:', error); }
        setLoading(false);
    }, [search]);

    useEffect(() => { fetchBooks(); }, [fetchBooks]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBook) {
                const res = await api.put(`/library/books/${editingBook._id}`, formData);
                if (res.data.success) {
                    toast.success('Book updated');
                    resetForm();
                    fetchBooks();
                }
            } else {
                const res = await api.post('/library/books', { ...formData, totalCopies: Number(formData.totalCopies) });
                if (res.data.success) {
                    toast.success('Book added');
                    resetForm();
                    fetchBooks();
                }
            }
        } catch (error) { toast.error(error.response?.data?.message || 'Operation failed'); }
    };

    const handleEdit = (book) => {
        setEditingBook(book);
        setFormData({
            title: book.title, author: book.author, isbn: book.isbn || '', publisher: book.publisher || '',
            category: book.category, department: book.department, totalCopies: book.totalCopies, shelfLocation: book.shelfLocation || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Delete "${title}"?`)) return;
        try {
            const res = await api.delete(`/library/books/${id}`);
            if (res.data.success) { toast.success('Book deleted'); fetchBooks(); }
        } catch (error) { toast.error(error.response?.data?.message || 'Cannot delete'); }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingBook(null);
        setFormData({ title: '', author: '', isbn: '', publisher: '', category: 'Textbook', department: 'General', totalCopies: 1, shelfLocation: '' });
    };

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1><FiBook style={{ marginRight: 8 }} /> Book Management</h1>
                    <p>Add, edit, and manage library books</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                    <FiPlus /> Add Book
                </button>
            </div>

            {/* Search */}
            <div className="section-card" style={{ marginBottom: 'var(--spacing-4)' }}>
                <div style={{ padding: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-2)' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input className="form-input" placeholder="Search books by title, author, ISBN..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchBooks()} style={{ paddingLeft: 36 }} />
                    </div>
                    <button className="btn btn-secondary" onClick={fetchBooks}>Search</button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="section-card" style={{ marginBottom: 'var(--spacing-4)' }}>
                    <div className="section-header"><h2>{editingBook ? 'Edit Book' : 'Add New Book'}</h2></div>
                    <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-6)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-3)' }}>
                            <div><label className="form-label">Title *</label>
                                <input className="form-input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
                            <div><label className="form-label">Author *</label>
                                <input className="form-input" required value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} /></div>
                            <div><label className="form-label">ISBN</label>
                                <input className="form-input" value={formData.isbn} onChange={e => setFormData({ ...formData, isbn: e.target.value })} /></div>
                            <div><label className="form-label">Publisher</label>
                                <input className="form-input" value={formData.publisher} onChange={e => setFormData({ ...formData, publisher: e.target.value })} /></div>
                            <div><label className="form-label">Category</label>
                                <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select></div>
                            <div><label className="form-label">Department</label>
                                <select className="form-input" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select></div>
                            <div><label className="form-label">Total Copies *</label>
                                <input className="form-input" type="number" min="1" required value={formData.totalCopies}
                                    onChange={e => setFormData({ ...formData, totalCopies: e.target.value })} /></div>
                            <div><label className="form-label">Shelf Location</label>
                                <input className="form-input" value={formData.shelfLocation} onChange={e => setFormData({ ...formData, shelfLocation: e.target.value })} /></div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                            <button type="submit" className="btn btn-primary">{editingBook ? 'Update' : 'Add'} Book</button>
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Books Table */}
            <div className="section-card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr><th>Title</th><th>Author</th><th>Category</th><th>Available</th><th>Shelf</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {books.map(b => (
                                <tr key={b._id}>
                                    <td><strong>{b.title}</strong>{b.isbn && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ISBN: {b.isbn}</span>}</td>
                                    <td>{b.author}</td>
                                    <td><span style={{ padding: '2px 8px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: '0.75rem' }}>{b.category}</span></td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: b.availableCopies > 0 ? '#27ae60' : '#e74c3c' }}>
                                            {b.availableCopies}/{b.totalCopies}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{b.shelfLocation || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button onClick={() => handleEdit(b)} className="btn btn-secondary" style={{ padding: '4px 8px' }}><FiEdit /></button>
                                            <button onClick={() => handleDelete(b._id, b.title)} className="btn btn-secondary" style={{ padding: '4px 8px' }}><FiTrash2 /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {books.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>No books found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LibrarianBooks;
