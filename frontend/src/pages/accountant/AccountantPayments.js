// src/components/accountant/AccountantPayments.jsx
import React, { useState } from 'react';
import { FiCheckCircle, FiXCircle, FiUploadCloud, FiEye, FiCreditCard } from 'react-icons/fi';
import PaymentQR from './PaymentQR'; 
import '../student/StudentPages.css';

const AccountantPayments = () => {
    // Sirf ek baar declare karein dummy data ke saath
    const [entries, setEntries] = useState([
        {
            _id: '1',
            userName: 'Amit Jadhav',
            userType: 'Student',
            amount: 50000,
            transactionId: 'TXN123456789',
            createdAt: new Date(),
            status: 'pending',
            receiptUrl: '#'
        },
    ]);

    const [loading, setLoading] = useState(false); 
    const [filter, setFilter] = useState('pending');

    // Razorpay Integration Logic
    const handleRazorpayPayment = () => {
        const options = {
            key: "rzp_test_Sh0A3gVJK6SC3T", // Yahan apni Razorpay Test Key ID daalein
            amount: 50000 * 100, // Amount in paise
            currency: "INR",
            name: "Samarth College ERP",
            description: "Fees Payment Test",
            handler: function (response) {
                // Payment success logic
                alert("Payment Successful!");
                
                const newPayment = {
                    _id: Date.now().toString(),
                    userName: 'Test Student',
                    userType: 'Student',
                    amount: 50000,
                    transactionId: response.razorpay_payment_id,
                    createdAt: new Date(),
                    status: 'approved', // Auto-approved on success
                    receiptUrl: '#'
                };
                
                // Nayi entry ko table mein sabse upar add karein
                setEntries(prev => [newPayment, ...prev]);
            },
            prefill: {
                name: "Amit Jadhav",
                email: "amit@example.com",
                contact: "9999999999"
            },
            theme: { color: "#3399cc" }
        };

        if (window.Razorpay) {
            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } else {
            alert("Razorpay SDK not loaded. Please check your internet or index.html script.");
        }
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'approved': return <span className="status-badge success">Approved</span>;
            case 'fake': return <span className="status-badge danger">Fake</span>;
            default: return <span className="status-badge warning">Pending</span>;
        }
    };

    return (
        <div className="student-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1><FiUploadCloud style={{ marginRight: 8 }} /> Payment Management</h1>
                    <p>Verify direct UPI transfers and manage transactions.</p>
                </div>
            </div>

            {/* ✅ QR Section & Gateway Test */}
            <div className="section-card" style={{ marginBottom: "var(--spacing-6)" }}>
                <div className="section-header"><h2>Official College QR Code</h2></div>
                <div style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
                    <p>Users will scan this code and upload their payment details.</p>
                    
                    <PaymentQR />

                    <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>-- OR --</p>
                        <button 
                            onClick={handleRazorpayPayment}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}
                        >
                            <FiCreditCard /> Pay via RazorPay
                        </button>
                    </div>
                </div>
            </div>

            {/* ✅ Table Section */}
            <div className="section-card">
                <div className="section-header">
                    <h2>Manual Payment Verification List</h2>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Amount</th>
                                <th>Transaction ID</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(e => (
                                <tr key={e._id}>
                                    <td><strong>{e.userName}</strong> <br/> <small>{e.userType}</small></td>
                                    <td style={{ fontWeight: 600, color: e.status === 'fake' ? 'red' : '#27ae60' }}>
                                        ₹{e.amount.toLocaleString()}
                                    </td>
                                    <td><code>{e.transactionId}</code></td>
                                    <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                                    <td>{formatStatus(e.status)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px'}}>
                                            <button className="btn-icon" title="View Proof"><FiEye /></button>
                                            <button className="btn-icon success" title="Verify"><FiCheckCircle /></button>
                                            <button className="btn-icon danger" title="Mark Fake"><FiXCircle /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccountantPayments;