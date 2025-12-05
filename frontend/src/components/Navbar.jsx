import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Sprout, Bell, User, Menu, X, Moon, Sun,
    Settings, LogOut, HelpCircle, MapPin, History,
    CheckCircle, AlertTriangle, Info, Trash2, LogIn
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useWeatherAlerts } from '../context/WeatherAlertsContext';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { user, logout, isAuthenticated } = useAuth();
    const { alerts, unreadCount, markAsRead, markAllAsRead, dismissAlert, clearAllAlerts } = useWeatherAlerts();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const notificationRef = useRef(null);
    const userMenuRef = useRef(null);

    const navItems = [
        { path: '/', label: 'Dashboard' },
        { path: '/farms', label: 'My Farms' },
        { path: '/predictions', label: 'Predictions' },
        { path: '/history', label: 'History' },
        { path: '/reports', label: 'Reports' },
        { path: '/assistant', label: '🤖 AI Assistant' },
    ];

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

    const handleMarkAllAsRead = () => {
        markAllAsRead();
        toast.success('All alerts marked as read');
    };

    const handleClearAlerts = () => {
        clearAllAlerts();
        toast.info('All alerts cleared');
    };

    const getAlertIcon = (type, severity) => {
        if (severity === 'high') return <AlertTriangle size={18} className="notif-icon warning" />;
        if (type === 'temperature') return <AlertTriangle size={18} className="notif-icon warning" />;
        if (type === 'rainfall') return <Info size={18} className="notif-icon info" />;
        return <Info size={18} className="notif-icon info" />;
    };

    const formatAlertTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
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
                                    <h4>Weather Alerts</h4>
                                    {alerts.length > 0 && (
                                        <button className="dropdown-action" onClick={handleMarkAllAsRead}>
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="dropdown-content">
                                    {alerts.length === 0 ? (
                                        <div className="empty-dropdown">
                                            <Bell size={32} />
                                            <p>No weather alerts</p>
                                        </div>
                                    ) : (
                                        alerts.slice(0, 10).map(alert => (
                                            <div
                                                key={alert.id}
                                                className={`notification-item ${!alert.read ? 'unread' : ''} ${alert.severity}`}
                                                onClick={() => markAsRead(alert.id)}
                                            >
                                                {getAlertIcon(alert.type, alert.severity)}
                                                <div className="notif-content">
                                                    <span className="notif-title">{alert.title}</span>
                                                    <span className="notif-message">{alert.message}</span>
                                                    <span className="notif-time">{formatAlertTime(alert.timestamp)}</span>
                                                    {alert.location && <span className="notif-location">📍 {alert.location}</span>}
                                                </div>
                                                <button
                                                    className="dismiss-btn"
                                                    onClick={(e) => { e.stopPropagation(); dismissAlert(alert.id); }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {alerts.length > 0 && (
                                    <div className="dropdown-footer">
                                        <button onClick={handleClearAlerts}>
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
                                        <span className="user-name">{user?.name || 'Farmer'}</span>
                                        <span className="user-email">{user?.email || 'farmer@geocrop.com'}</span>
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
                                    <button className="dropdown-item" onClick={() => navigate('/alerts')}>
                                        <AlertTriangle size={18} />
                                        Weather Alerts
                                    </button>
                                    <button className="dropdown-item" onClick={() => navigate('/settings')}>
                                        <Settings size={18} />
                                        Settings
                                    </button>
                                    <button className="dropdown-item" onClick={() => navigate('/help')}>
                                        <HelpCircle size={18} />
                                        Help & Support
                                    </button>
                                </div>

                                <div className="dropdown-divider"></div>

                                <div className="dropdown-content">
                                    <button className="dropdown-item logout" onClick={() => { logout(); navigate('/login'); toast.success('Logged out successfully'); }}>
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
                    <button className="mobile-user-btn" onClick={() => { closeMobileMenu(); navigate('/settings'); }}>
                        <Settings size={20} />
                        <span>Settings</span>
                    </button>
                    <button className="mobile-user-btn" onClick={() => { closeMobileMenu(); navigate('/help'); }}>
                        <HelpCircle size={20} />
                        <span>Help & Support</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
