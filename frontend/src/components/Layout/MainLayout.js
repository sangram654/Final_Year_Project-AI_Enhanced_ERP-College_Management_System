import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiUser, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './MainLayout.css';

const MainLayout = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isAuthenticated, getDashboardRoute } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/about', label: 'About' },
        { path: '/gallery', label: 'Gallery' },
        { path: '/contact', label: 'Contact' },
    ];

    return (
        <div className="main-layout">
            {/* Navigation Header */}
            <header className={`main-header ${isScrolled ? 'scrolled' : ''}`}>
                <div className="header-container">
                    {/* Logo */}
                    <Link to="/" className="logo">
                        <img src="/logo2.jpg" alt="Samarth College Logo" className="logo-img" />
                        <div className="logo-text">
                            <span className="college-name">Samarth College</span>
                            <span className="college-tagline">Engineering & Management</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="desktop-nav">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Auth Buttons */}
                    <div className="auth-buttons">
                        {isAuthenticated ? (
                            <Link to={getDashboardRoute()} className="btn btn-primary">
                                <FiUser />
                                Dashboard
                            </Link>
                        ) : (
                            <Link to="/login" className="btn btn-primary">
                                <FiLogIn />
                                Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`mobile-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="mobile-auth">
                        {isAuthenticated ? (
                            <Link to={getDashboardRoute()} className="btn btn-primary w-full">
                                Dashboard
                            </Link>
                        ) : (
                            <Link to="/login" className="btn btn-primary w-full">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="main-footer">
                <div className="footer-container">
                    <div className="footer-grid">
                        {/* College Info */}
                        <div className="footer-section">
                            <div className="footer-logo">
                                <img src="/logo2.jpg" alt="Logo" />
                                <div>
                                    <h3>Samarth College</h3>
                                    <p>of Engineering & Management</p>
                                </div>
                            </div>
                            <p className="footer-description">
                                Empowering students with quality education and creating future leaders in technology and management.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div className="footer-section">
                            <h4>Quick Links</h4>
                            <ul>
                                <li><Link to="/about">About Us</Link></li>
                                <li><Link to="/gallery">Gallery</Link></li>
                                <li><Link to="/contact">Contact</Link></li>
                                <li><Link to="/login">Student Login</Link></li>
                            </ul>
                        </div>

                        {/* Departments */}
                        <div className="footer-section">
                            <h4>Departments</h4>
                            <ul>
                                <li>Computer Engineering</li>
                                <li>Mechanical Engineering</li>
                                <li>Civil Engineering</li>
                                <li>Electrical Engineering</li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div className="footer-section">
                            <h4>Contact Us</h4>
                            <address>
                                <p>Belhe, Tal. Junnar</p>
                                <p>Dist. Pune - 410501</p>
                                <p>Maharashtra, India</p>
                                <p>📞 +91-1234567890</p>
                                <p>✉️ info@samarthcollege.edu.in</p>
                            </address>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} Samarth Rural Educational Institute. All Rights Reserved.</p>
                        <div className="footer-links">
                            <button type="button" style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</button>
                            <button type="button" style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
