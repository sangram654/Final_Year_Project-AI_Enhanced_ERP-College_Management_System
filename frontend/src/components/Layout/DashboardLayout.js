import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FiHome, FiUsers, FiBook, FiCalendar, FiDollarSign,
FiFileText, FiCheckCircle, FiAward, FiImage, FiBarChart2, FiSettings,
    FiLogOut, FiMenu, FiX, FiBell, FiUser, FiChevronDown,
    FiHelpCircle, FiMessageSquare, FiVideo, FiCpu, FiClock
} from 'react-icons/fi';
import { MdFingerprint } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import ChatbotWidget from '../ChatbotWidget/ChatbotWidget';
import './DashboardLayout.css';

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Navigation items based on user role
    const getNavItems = () => {
        const baseRoute = user?.role === 'super_admin' ? '/super-admin' : `/${user?.role}`;

        const studentNav = [
            { path: `${baseRoute}/dashboard`, icon: FiHome, label: 'Dashboard' },
            { path: `${baseRoute}/notices`, icon: FiBell, label: 'Notices' },
            { path: `${baseRoute}/meetings`, icon: FiVideo, label: 'Virtual Meetings' },
            { path: `${baseRoute}/attendance`, icon: FiCalendar, label: 'Attendance' },
            { path: `${baseRoute}/biometric-attendance`, icon: MdFingerprint, label: 'Biometric Attendance' },
            { path: `${baseRoute}/fees`, icon: FiDollarSign, label: 'Fees' },
            { path: `${baseRoute}/marks`, icon: FiBook, label: 'Marks & Results' },
            { path: `${baseRoute}/notes`, icon: FiFileText, label: 'Study Materials' },
            { path: `${baseRoute}/leave`, icon: FiCalendar, label: 'Leave' },
            { path: `${baseRoute}/scholarship`, icon: FiAward, label: 'Scholarships' },
            { path: `${baseRoute}/library`, icon: FiBook, label: 'Library' },
            { path: `${baseRoute}/profile`, icon: FiUser, label: 'Profile' },
        ];

        const teacherNav = [
            { path: `${baseRoute}/dashboard`, icon: FiHome, label: 'Dashboard' },
            { path: `${baseRoute}/notices`, icon: FiBell, label: 'Notices' },
            { path: `${baseRoute}/meetings`, icon: FiVideo, label: 'Virtual Meetings' },
            { path: `${baseRoute}/students`, icon: FiUsers, label: 'Students' },
            { path: `${baseRoute}/attendance`, icon: FiCalendar, label: 'Attendance' },
            { path: `${baseRoute}/biometric-attendance`, icon: MdFingerprint, label: 'Biometric Attendance' },
            { path: `${baseRoute}/biometric-terminal`, icon: FiCpu, label: 'Biometric Terminal' },
            { path: `${baseRoute}/marks`, icon: FiBook, label: 'Marks Entry' },
            { path: `${baseRoute}/notes`, icon: FiFileText, label: 'Upload Notes' },    
            { path: `${baseRoute}/leave`, icon: FiCalendar, label: 'Apply Leave' },
            { path: `${baseRoute}/leaves`, icon: FiCalendar, label: 'Leave Approvals' },
            { path: `${baseRoute}/library`, icon: FiBook, label: 'Library' },
            { path: `${baseRoute}/profile`, icon: FiUser, label: 'Profile' },
        ];

        const parentNav = [
            { path: `${baseRoute}/dashboard`, icon: FiHome, label: 'Dashboard' },
            { path: `${baseRoute}/notices`, icon: FiBell, label: 'Notices' },
            { path: `${baseRoute}/meetings`, icon: FiVideo, label: 'Virtual Meetings' },
            { path: `${baseRoute}/attendance`, icon: FiCalendar, label: 'Attendance' },
            { path: `${baseRoute}/biometric-attendance`, icon: MdFingerprint, label: 'Biometric Attendance' },
            { path: `${baseRoute}/marks`, icon: FiBook, label: 'Marks & Results' },
            { path: `${baseRoute}/fees`, icon: FiDollarSign, label: 'Fees' },
            { path: `${baseRoute}/leave`, icon: FiCalendar, label: 'Leave' },
            { path: `${baseRoute}/profile`, icon: FiUser, label: 'Profile' },
        ];

        const adminNav = [
            { path: `${baseRoute}/dashboard`, icon: FiHome, label: 'Dashboard' },
            { path: `${baseRoute}/notices`, icon: FiBell, label: 'Notices' },
            { path: `${baseRoute}/meetings`, icon: FiVideo, label: 'Virtual Meetings' },
            { path: `${baseRoute}/attendance`, icon: FiCalendar, label: 'Attendance' },
            { path: `${baseRoute}/biometric-attendance`, icon: MdFingerprint, label: 'Biometric Attendance' },
            { path: `${baseRoute}/leaves`, icon: FiCalendar, label: 'Leave Approvals' },
            { path: `${baseRoute}/students`, icon: FiUsers, label: 'Students' },
            { path: `${baseRoute}/teachers`, icon: FiUsers, label: 'Teachers' },
            { path: `${baseRoute}/parents`, icon: FiUsers, label: 'Parents' },
            { path: `${baseRoute}/subjects`, icon: FiBook, label: 'Subjects' },
            { path: `${baseRoute}/classes`, icon: FiCalendar, label: 'Classes' },
            { path: `${baseRoute}/teaching-assignments`, icon: FiBook, label: 'Teaching Assignments' },
            { path: `${baseRoute}/fees`, icon: FiDollarSign, label: 'Fees' },
            { path: `${baseRoute}/scholarships`, icon: FiAward, label: 'Scholarships' },
            { path: `${baseRoute}/leaves`, icon: FiCalendar, label: 'Leave Applications' },
            { path: `${baseRoute}/gallery`, icon: FiImage, label: 'Gallery' },
            { path: `${baseRoute}/reports`, icon: FiBarChart2, label: 'Reports' },
            { path: `${baseRoute}/ai-insights`, icon: FiCpu, label: '🤖 AI Insights' },
            { path: `${baseRoute}/profile`, icon: FiUser, label: 'Profile' },
        ];

        const superAdminNav = [
            { path: `${baseRoute}/dashboard`, icon: FiHome, label: 'Dashboard' },
            { path: `${baseRoute}/notices`, icon: FiBell, label: 'Notices' },
            { path: `${baseRoute}/users`, icon: FiUsers, label: 'User Management' },
            { path: `${baseRoute}/meetings`, icon: FiVideo, label: 'Virtual Meetings' },
            { path: `${baseRoute}/attendance`, icon: FiCalendar, label: 'Attendance' },
            { path: `${baseRoute}/biometric-attendance`, icon: MdFingerprint, label: 'Biometric Attendance' },
            { path: `${baseRoute}/leaves`, icon: FiCalendar, label: 'Leave Approvals' },
            { path: `${baseRoute}/students`, icon: FiUsers, label: 'Students' },
            { path: `${baseRoute}/teachers`, icon: FiUsers, label: 'Teachers' },
            { path: `${baseRoute}/parents`, icon: FiUsers, label: 'Parents' },
            { path: `${baseRoute}/subjects`, icon: FiBook, label: 'Subjects' },
            { path: `${baseRoute}/classes`, icon: FiCalendar, label: 'Classes' },
            { path: `${baseRoute}/teaching-assignments`, icon: FiBook, label: 'Teaching Assignments' },
            { path: `${baseRoute}/fees`, icon: FiDollarSign, label: 'Fees' },
            { path: `${baseRoute}/scholarships`, icon: FiAward, label: 'Scholarships' },
            { path: `${baseRoute}/gallery`, icon: FiImage, label: 'Gallery' },
            { path: `${baseRoute}/reports`, icon: FiBarChart2, label: 'Reports' },
            { path: `${baseRoute}/biometric-terminal`, icon: FiCpu, label: 'Biometric Terminal' },
            { path: `${baseRoute}/shift-attendance`, icon: FiClock, label: 'Shift Attendance' },
            { path: `${baseRoute}/ai-insights`, icon: FiCpu, label: '🤖 AI Insights' },
            { path: `${baseRoute}/profile`, icon: FiUser, label: 'Profile' },
        ];

        const accountantNav = [
            { path: `${baseRoute}/dashboard`, icon: FiHome, label: 'Dashboard' },
            { path: `${baseRoute}/notices`, icon: FiBell, label: 'Notices' },
            { path: `${baseRoute}/fees`, icon: FiDollarSign, label: 'Fee Collection' },
            { path: `${baseRoute}/payments`, icon: FiCheckCircle, label: 'Payment Management' },
            { path: `${baseRoute}/income`, icon: FiBarChart2, label: 'Income' },
            { path: `${baseRoute}/expenses`, icon: FiBarChart2, label: 'Expenses' },
            { path: `${baseRoute}/reports`, icon: FiFileText, label: 'Financial Reports' },
            { path: `${baseRoute}/profile`, icon: FiUser, label: 'Profile' },
        ];

        const librarianNav = [
            { path: `${baseRoute}/dashboard`, icon: FiHome, label: 'Dashboard' },
            { path: `${baseRoute}/notices`, icon: FiBell, label: 'Notices' },
            { path: `${baseRoute}/books`, icon: FiBook, label: 'Book Management' },
            { path: `${baseRoute}/issue`, icon: FiBook, label: 'Issue / Return' },
            { path: `${baseRoute}/profile`, icon: FiUser, label: 'Profile' },
        ];

        const receptionistNav = [
            { path: `${baseRoute}/dashboard`, icon: FiHome, label: 'Dashboard' },
            { path: `${baseRoute}/notices`, icon: FiBell, label: 'Notices' },
            { path: `${baseRoute}/front-office`, icon: FiFileText, label: 'Front Office' },
            { path: `${baseRoute}/visitors`, icon: FiUsers, label: 'Visitor Log' },
            { path: `${baseRoute}/inquiries`, icon: FiHelpCircle, label: 'Inquiries' },
            { path: `${baseRoute}/student-info`, icon: FiUser, label: 'Student Information' },
            { path: `${baseRoute}/profile`, icon: FiUser, label: 'Profile' },
        ];

        switch (user?.role) {
            case 'super_admin': return superAdminNav;
            case 'student': return studentNav;
            case 'teacher': return teacherNav;
            case 'parent': return parentNav;
            case 'admin': return adminNav;
            case 'accountant': return accountantNav;
            case 'librarian': return librarianNav;
            case 'receptionist': return receptionistNav;
            default: return [];
        }
    };

    const navItems = getNavItems();

    const getRoleLabel = () => {
        switch (user?.role) {
            case 'super_admin': return 'Super Admin Portal';
            case 'student': return 'Student Portal';
            case 'teacher': return 'Teacher Portal';
            case 'parent': return 'Parent Portal';
            case 'admin': return 'Admin Portal';
            case 'accountant': return 'Accountant Portal';
            case 'librarian': return 'Library Portal';
            case 'receptionist': return 'Reception Portal';
            default: return 'Dashboard';
        }
    };

    return (
        <div className={`dashboard-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
            {/* Sidebar */}
            <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-logo">
                        <img src="/logo2.jpg" alt="Logo" />
                        {sidebarOpen && <span>Samarth ERP</span>}
                    </Link>
                    <button
                        className="sidebar-close-mobile"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <FiX />
                    </button>
                </div>

                <div className="sidebar-role-badge">
                    {getRoleLabel()}
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <item.icon className="nav-icon" />
                            {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-nav-item logout-btn" onClick={handleLogout}>
                        <FiLogOut className="nav-icon" />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="dashboard-main">
                {/* Top Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <button
                            className="menu-toggle"
                            onClick={() => {
                                if (window.innerWidth <= 768) {
                                    setMobileMenuOpen(!mobileMenuOpen);
                                } else {
                                    setSidebarOpen(!sidebarOpen);
                                }
                            }}
                        >
                            <FiMenu />
                        </button>
                        <div className="breadcrumb">
                            <span className="breadcrumb-role">{getRoleLabel()}</span>
                            <span className="breadcrumb-separator">/</span>
                            <span className="breadcrumb-page">
                                {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                            </span>
                        </div>
                    </div>

                    <div className="header-right">
                        {/* Profile Dropdown */}
                        <div className="profile-dropdown" ref={dropdownRef}>
                            <button
                                className="profile-btn"
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                            >
                                <div className="profile-avatar">
                                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                </div>
                                <div className="profile-info">
                                    <span className="profile-name">{user?.firstName} {user?.lastName}</span>
                                    <span className="profile-role">{user?.role}</span>
                                </div>
                                <FiChevronDown className={`dropdown-icon ${profileDropdownOpen ? 'open' : ''}`} />
                            </button>

                            {profileDropdownOpen && (
                                <div className="dropdown-menu">
                                    <Link to={`/${user?.role}/profile`} className="dropdown-item">
                                        <FiUser /> Profile
                                    </Link>
                                    <Link to={`/${user?.role}/profile`} className="dropdown-item">
                                        <FiSettings /> Settings
                                    </Link>
                                    <hr />
                                    <button className="dropdown-item logout" onClick={handleLogout}>
                                        <FiLogOut /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>

            {/* AI Chatbot Widget — visible on all dashboard pages */}
            <ChatbotWidget userRole={user?.role} />
        </div>
    );
};

export default DashboardLayout;
