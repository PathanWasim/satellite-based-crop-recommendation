import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Sprout, Bell, User, Menu, X, Moon, Sun,
    Settings, LogOut, HelpCircle, MapPin, History,
    CheckCircle, AlertTriangle, Info, Trash2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const notificationRef = useRef(null);
    const userMenuRef = useRef(null);

    // Sample notifications
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'success',
            title: 'Prediction Complete',
            message: 'Wheat recommended for North Field with 94% confidence',
            time: '2 min ago',
            read: false
        },
        {
            id: 2,
            type: 'warning',
            title: 'Weather Alert',
            message: 'Heavy rainfall expected in your region tomorrow',
            time: '1 hour ago',
            read: false
        },
        {
            id: 3,
            type: 'info',
            title: 'New Feature',
            message: 'Dark mode is now available! Try it out.',
            time: '3 hours ago',
            read: true
        }
    ]);

    const navItems = [
        { path: '/', label: 'Dashboard' },
        { path: '/farms', label: 'My Farms' },
        { path: '/predictions', label: 'Predictions' },
        { path: '/history', label: 'History' },
        { path: '/reports', label: 'Reports' },
    ];

    const unreadCount = notifications.filter(n => !n.read).length;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notificationRef.current && !notificationRef.current.contains(e.target)) {
                setIsNotificationOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsNotificationOpen(false);
        setIsUserMenuOpen(false);
    }, [location.pathname]);

    // Close mobile menu on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
                setIsNotificationOpen(false);
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [isMobileMenuOpen]);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
    };

    const clearNotifications = () => {
        setNotifications([]);
        toast.info('Notifications cleared');
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={18} className="notif-icon success" />;
            case 'warning': return <AlertTriangle size={18} className="notif-icon warning" />;
            default: return <Info size={18} className="notif-icon info" />;
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <Sprout className="brand-icon" size={32} />
                    <span className="brand-name">GeoCrop</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="navbar-links desktop-only">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="navbar-actions">
                    {/* Theme Toggle */}
                    <button
                        className="icon-btn theme-toggle"
                        onClick={toggleDarkMode}
                        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {/* Notifications */}
                    <div className="dropdown-container" ref={notificationRef}>
                        <button
                            className={`icon-btn ${isNotificationOpen ? 'active' : ''}`}
                            onClick={() => {
                                setIsNotificationOpen(!isNotificationOpen);
                                setIsUserMenuOpen(false);
                            }}
                            aria-label="Notifications"
                            title="Notifications"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </button>

                        {isNotificationOpen && (
                            <div className="dropdown-menu notifications-dropdown">
                                <div className="dropdown-header">
                                    <h4>Notifications</h4>
                                    {notifications.length > 0 && (
                                        <button className="dropdown-action" onClick={markAllAsRead}>
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="dropdown-content">
                                    {notifications.length === 0 ? (
                                        <div className="empty-dropdown">
                                            <Bell size={32} />
                                            <p>No notifications</p>
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                                onClick={() => markAsRead(notif.id)}
                                            >
                                                {getNotificationIcon(notif.type)}
                                                <div className="notif-content">
                                                    <span className="notif-title">{notif.title}</span>
                                                    <span className="notif-message">{notif.message}</span>
                                                    <span className="notif-time">{notif.time}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="dropdown-footer">
                                        <button onClick={clearNotifications}>
                                            <Trash2 size={14} />
                                            Clear all
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="dropdown-container desktop-only" ref={userMenuRef}>
                        <button
                            className={`icon-btn user-btn ${isUserMenuOpen ? 'active' : ''}`}
                            onClick={() => {
                                setIsUserMenuOpen(!isUserMenuOpen);
                                setIsNotificationOpen(false);
                            }}
                            aria-label="User menu"
                            title="Account"
                        >
                            <User size={20} />
                        </button>

                        {isUserMenuOpen && (
                            <div className="dropdown-menu user-dropdown">
                                <div className="user-header">
                                    <div className="user-avatar">
                                        <User size={24} />
                                    </div>
                                    <div className="user-info">
                                        <span className="user-name">Farmer</span>
                                        <span className="user-email">farmer@geocrop.com</span>
                                    </div>
                                </div>

                                <div className="dropdown-divider"></div>

                                <div className="dropdown-content">
                                    <button className="dropdown-item" onClick={() => navigate('/farms')}>
                                        <MapPin size={18} />
                                        My Farms
                                    </button>
                                    <button className="dropdown-item" onClick={() => navigate('/history')}>
                                        <History size={18} />
                                        Prediction History
                                    </button>
                                    <button className="dropdown-item" onClick={() => toast.info('Settings coming soon!')}>
                                        <Settings size={18} />
                                        Settings
                                    </button>
                                    <button className="dropdown-item" onClick={() => toast.info('Help center coming soon!')}>
                                        <HelpCircle size={18} />
                                        Help & Support
                                    </button>
                                </div>

                                <div className="dropdown-divider"></div>

                                <div className="dropdown-content">
                                    <button className="dropdown-item logout" onClick={() => toast.info('Logout coming soon!')}>
                                        <LogOut size={18} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hamburger Menu Button */}
                    <button
                        className="hamburger-btn mobile-only"
                        onClick={toggleMobileMenu}
                        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={isMobileMenuOpen}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={closeMobileMenu} aria-hidden="true" />
            )}

            {/* Mobile Menu Panel */}
            <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-header">
                    <span className="mobile-menu-title">Menu</span>
                    <button className="mobile-menu-close" onClick={closeMobileMenu} aria-label="Close menu">
                        <X size={24} />
                    </button>
                </div>
                <div className="mobile-menu-links">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
                <div className="mobile-menu-footer">
                    <button className="mobile-user-btn" onClick={() => { closeMobileMenu(); toast.info('Profile coming soon!'); }}>
                        <User size={20} />
                        <span>Profile</span>
                    </button>
                    <button className="mobile-user-btn" onClick={() => { closeMobileMenu(); toast.info('Settings coming soon!'); }}>
                        <Settings size={20} />
                        <span>Settings</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
