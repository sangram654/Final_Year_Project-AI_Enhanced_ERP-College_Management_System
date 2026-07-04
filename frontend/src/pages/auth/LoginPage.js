import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [activeDemo, setActiveDemo] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, getDashboardRoute } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const demoAccounts = [
        {
            key: 'super_admin',
            label: 'Super Admin',
            email: 'superadmin123@gmail.com',
            password: 'superadmin@123',
        },
        {
            key: 'admin',
            label: 'Admin',
            email: 'admin123@gmail.com',
            password: 'admin@123',
        },
        {
            key: 'teacher',
            label: 'Teacher',
            email: 'ramkadam123@gmail.com',
            password: 'ramkadam@123',
        },
        {
            key: 'student',
            label: 'Student',
            email: 'rahulpatil123@gmail.com',
            password: 'rahulpatil@123',
        },
        {
            key: 'parent',
            label: 'Parent',
            email: 'sureshpatilparent123@gmail.com',
            password: 'sureshpatil@123',
        },
        {
            key: 'accountant',
            label: 'Accountant',
            email: 'accountant@gmail.com',
            password: 'accountant@123',
        },
        {
            key: 'librarian',
            label: 'Librarian',
            email: 'librarian@gmail.com',
            password: 'librarian@123',
        },
        {
            key: 'receptionist',
            label: 'Receptionist',
            email: 'receptionist@gmail.com',
            password: 'receptionist@123',
        },
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (activeDemo) {
            setActiveDemo('');
        }
    };

    const handleDemoSelect = (account) => {
        setFormData({
            email: account.email,
            password: account.password,
        });
        setActiveDemo(account.key);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await login(formData.email, formData.password);

        if (result.success) {
            toast.success('Login successful!');
            const from = location.state?.from?.pathname;
            const dashboardRoute = getDashboardRoute(result.user?.role);
            const targetRoute = from && from !== '/login' ? from : dashboardRoute;
            navigate(targetRoute, { replace: true });
        } else {
            toast.error(result.message);
        }

        setLoading(false);
    };

    const getWelcomeMessage = () => 'Welcome Back';

    const getSubtitle = () => 'Sign in to access your dashboard';

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* Left Side - Image/Branding */}
                <div className="auth-branding">
                    <div className="branding-content">
                        <Link to="/" className="auth-logo">
                            <img src="/logo2.jpg" alt="Samarth College" />
                        </Link>
                        <h1>Samarth College</h1>
                        <p>of Engineering & Management</p>
                        <div className="branding-tagline">
                            Empowering Education Through Technology
                        </div>
                    </div>
                    <div className="branding-decoration">
                        <div className="circle circle-1"></div>
                        <div className="circle circle-2"></div>
                        <div className="circle circle-3"></div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="auth-form-container">
                    <div className="auth-form-wrapper">
                        <div className="auth-header">
                            <h2>{getWelcomeMessage()}</h2>
                            <p>{getSubtitle()}</p>
                        </div>

                        <div className="demo-credentials">
                            {demoAccounts.map((account) => (
                                <button
                                    key={account.key}
                                    type="button"
                                    className={`demo-btn ${activeDemo === account.key ? 'active' : ''}`}
                                    onClick={() => handleDemoSelect(account)}
                                    disabled={loading}
                                >
                                    {account.label}
                                </button>
                            ))}
                        </div>
                        <p className="form-hint" style={{ marginBottom: 'var(--spacing-4)' }}>
                            Quick login credentials for testing 8 accounts
                        </p>

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div className="input-icon-wrapper">
                                    <FiMail className="input-icon" />
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input with-icon"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="input-icon-wrapper">
                                    <FiLock className="input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className="form-input with-icon"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-options">
                                <label className="checkbox-wrapper">
                                    <input type="checkbox" />
                                    <span className="checkmark"></span>
                                    Remember me
                                </label>
                                <button type="button" className="forgot-link" style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}>Forgot Password?</button>
                            </div>

                            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                                {loading ? (
                                    <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                                ) : (
                                    <>
                                        Sign In
                                        <FiArrowRight />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;