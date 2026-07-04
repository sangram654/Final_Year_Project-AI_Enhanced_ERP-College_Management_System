import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import '../student/StudentPages.css';
import PaymentQR from './PaymentQR'; 

const AccountantIncome = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalAmount, setTotalAmount] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        incomeHead: '', name: '', amount: '', date: new Date().toISOString().split('T')[0],
        description: '', paymentMethod: 'cash', invoiceNo: '',
    });

    const incomeHeads = ['Tuition Fee', 'Hostel Fee', 'Lab Fee', 'Library Fee', 'Exam Fee', 'Donation', 'Other'];

    useEffect(() => { fetchIncome(); }, []);

    const fetchIncome = async () => {
        try {
            const res = await api.get('/accountant/income');
            if (res.data.success) {
                setEntries(res.data.data);
                setTotalAmount(res.data.totalAmount);
            }
        } catch (error) { console.error('Error:', error); }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/accountant/income', { ...formData, amount: Number(formData.amount) });
            if (res.data.success) {
                toast.success('Income added successfully');
                setShowForm(false);
                setFormData({ incomeHead: '', name: '', amount: '', date: new Date().toISOString().split('T')[0], description: '', paymentMethod: 'cash', invoiceNo: '' });
                fetchIncome();
            }
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to add income'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this income entry?')) return;
        try {
            await api.delete(`/accountant/income/${id}`);
            toast.success('Entry deleted');
            fetchIncome();
        } catch (error) { toast.error('Failed to delete'); }
    };



    if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1><FiDollarSign style={{ marginRight: 8 }} /> Income Management</h1>
                    <p>Track and manage all college income</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <FiPlus /> {showForm ? 'Close Form' : 'Add Income'}
                </button>
            </div>

            {/* Total Income Card */}
            <div className="summary-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="summary-card">
                    <div className="summary-icon present"><FiDollarSign /></div>
                    <div className="summary-content">
                        <h3>₹{totalAmount.toLocaleString()}</h3>
                        <p>Total Income</p>
                    </div>
                </div>
            </div>

            {/* ✅ NEW QR PAYMENT SECTION INTEGRATED */}
            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                <PaymentQR />
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="section-card" style={{ marginBottom: 'var(--spacing-4)' }}>
                    <div className="section-header"><h2>Add Income Entry</h2></div>
                    <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-6)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-3)' }}>
                            <div>
                                <label className="form-label">Income Head *</label>
                                <select className="form-input" required value={formData.incomeHead}
                                    onChange={e => setFormData({ ...formData, incomeHead: e.target.value })}>
                                    <option value="">Select</option>
                                    {incomeHeads.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Name *</label>
                                <input className="form-input" required value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Amount (₹) *</label>
                                <input className="form-input" type="number" min="1" required value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Date *</label>
                                <input className="form-input" type="date" required value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Invoice No</label>
                                <input className="form-input" value={formData.invoiceNo}
                                    onChange={e => setFormData({ ...formData, invoiceNo: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Payment Method</label>
                                <select className="form-input" value={formData.paymentMethod}
                                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="online">Online</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: 'var(--spacing-3)' }}>
                            <label className="form-label">Description</label>
                            <textarea className="form-input" rows="2" value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                            <button type="submit" className="btn btn-primary">Save Income</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Income Table */}
            <div className="section-card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Income Head</th>
                                <th>Name</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(e => (
                                <tr key={e._id}>
                                    <td>{new Date(e.date).toLocaleDateString()}</td>
                                    <td><strong>{e.incomeHead}</strong></td>
                                    <td>{e.name}</td>
                                    <td style={{ fontWeight: 600, color: '#27ae60' }}>₹{e.amount?.toLocaleString()}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{e.paymentMethod?.replace('_', ' ')}</td>
                                    <td>
                                        <button onClick={() => handleDelete(e._id)} className="btn btn-secondary" style={{ padding: '4px 10px' }}>
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {entries.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>No income entries yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccountantIncome;