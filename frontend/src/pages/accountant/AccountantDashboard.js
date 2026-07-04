import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FiDollarSign, FiTrendingUp, FiTrendingDown,
    FiAlertCircle, FiPlusCircle, FiFileText
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import '../student/StudentPages.css';

const AccountantDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    
    // Dummy Stats taaki Dashboard khali na dikhe aur error na aaye
    const [stats, setStats] = useState({
        monthlyIncome: 45000,
        monthlyExpense: 12500,
        monthlyFeeCollection: 120000,
        pendingFees: 24,
    });

    const [recentPayments, setRecentPayments] = useState([
        {
            student: { firstName: 'Rahul', lastName: 'Kumar' },
            amount: 5000,
            paymentDate: new Date()
        },
        {
            student: { firstName: 'Sanket', lastName: 'Patil' },
            amount: 12000,
            paymentDate: new Date()
        }
    ]);

    useEffect(() => {
        // Backend band hone par error na aaye isliye fetch call ko abhi bypass kar rahe hain
        const loadDashboardData = async () => {
            try {
                const res = await api.get('/accountant/dashboard');
                if (res.data.success) {
                    setStats(res.data.data.stats);
                    setRecentPayments(res.data.data.recentPayments || []);
                }
            } catch (error) {
                console.log('Backend not connected, using dummy data');
                // Yahan toast.error nahi likha hai, isliye laal box nahi aayega
            }
            setLoading(false);
        };

        loadDashboardData();
    }, []);

    const formatCurrency = (amount) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount.toLocaleString()}`;
    };

    if (loading) {
        return <div className="page-loading"><div className="spinner"></div><p>Loading dashboard...</p></div>;
    }

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>💰 Accountant Dashboard</h1>
                    <p>Welcome, {user?.firstName}! Financial overview for this month.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-icon present"><FiTrendingUp /></div>
                    <div className="summary-content">
                        <h3>{formatCurrency(stats.monthlyIncome)}</h3>
                        <p>Monthly Income</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon absent"><FiTrendingDown /></div>
                    <div className="summary-content">
                        <h3>{formatCurrency(stats.monthlyExpense)}</h3>
                        <p>Monthly Expense</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon total"><FiDollarSign /></div>
                    <div className="summary-content">
                        <h3>{formatCurrency(stats.monthlyFeeCollection)}</h3>
                        <p>Fee Collected</p>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon percentage"><FiAlertCircle /></div>
                    <div className="summary-content">
                        <h3>{stats.pendingFees}</h3>
                        <p>Pending Fees</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Section */}
            <div className="section-card">
                <div className="section-header"><h2>Quick Actions</h2></div>
                <div style={{ padding: 'var(--spacing-6)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-4)' }}>
                    <Link to="/accountant/income" className="btn btn-primary"><FiPlusCircle /> Add Income</Link>
                    <Link to="/accountant/expenses" className="btn btn-secondary"><FiPlusCircle /> Add Expense</Link>
                    <Link to="/accountant/payments" className="btn btn-secondary"><FiDollarSign /> Payment Management</Link>
                    <Link to="/accountant/fees" className="btn btn-secondary"><FiDollarSign /> Fee Collection</Link>
                    <Link to="/accountant/reports" className="btn btn-secondary"><FiFileText /> Financial Summary</Link>
                </div>
            </div>

            {/* Monthly Summary Boxes */}
            <div className="section-card">
                <div className="section-header"><h2>Monthly Summary</h2></div>
                <div style={{ padding: 'var(--spacing-6)' }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: 'var(--spacing-4)',
                    }}>
                        <div style={{ padding: 'var(--spacing-4)', background: '#e8f5e9', borderRadius: 'var(--radius-lg)', border: '1px solid #4caf50' }}>
                            <h4 style={{ color: '#2e7d32' }}>Total Income (This Month)</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2e7d32' }}>{formatCurrency(stats.monthlyIncome + stats.monthlyFeeCollection)}</p>
                        </div>
                        <div style={{ padding: 'var(--spacing-4)', background: '#fce4ec', borderRadius: 'var(--radius-lg)', border: '1px solid #e91e63' }}>
                            <h4 style={{ color: '#c62828' }}>Total Expense (This Month)</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c62828' }}>{formatCurrency(stats.monthlyExpense)}</p>
                        </div>
                        <div style={{ padding: 'var(--spacing-4)', background: '#e3f2fd', borderRadius: 'var(--radius-lg)', border: '1px solid #2196f3' }}>
                            <h4 style={{ color: '#1565c0' }}>Net Balance</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1565c0' }}>
                                {formatCurrency((stats.monthlyIncome + stats.monthlyFeeCollection) - stats.monthlyExpense)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Payments Table */}
            <div className="section-card">
                <div className="section-header"><h2>Recent Fee Payments</h2></div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Amount</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPayments.length > 0 ? recentPayments.slice(0, 8).map((p, i) => (
                                <tr key={i}>
                                    <td>{p.student?.firstName} {p.student?.lastName}</td>
                                    <td style={{ fontWeight: 600, color: '#27ae60' }}>₹{p.amount?.toLocaleString()}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>
                                        {new Date(p.paymentDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No recent payments</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccountantDashboard;