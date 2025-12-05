import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Moon, Sun, Globe, Shield, Save, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWeatherAlerts } from '../context/WeatherAlertsContext';
import { useToast } from '../context/ToastContext';
import './Settings.css';

const Settings = () => {
    const { user, updateProfile } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { preferences, updatePreferences } = useWeatherAlerts();
    const toast = useToast();

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        location: user?.location || ''
    });

    const [appSettings, setAppSettings] = useState({
        language: 'en',
        units: 'metric',
        autoDetectLocation: true
    });

    useEffect(() => {
        const savedSettings = localStorage.getItem('geocrop_app_settings');
        if (savedSettings) {
            setAppSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleProfileSave = () => {
        updateProfile(profileData);
        toast.success('Profile updated successfully!');
    };

    const handleAppSettingsSave = () => {
        localStorage.setItem('geocrop_app_settings', JSON.stringify(appSettings));
        toast.success('Settings saved!');
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <SettingsIcon size={28} />
                <h1>Settings</h1>
            </div>

            {/* Profile Section */}
            <section className="settings-section">
                <h2><User size={20} /> Profile Settings</h2>
                <div className="settings-card">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            <User size={40} />
                        </div>
                        <button className="btn btn-secondary btn-sm">
                            <Camera size={16} />
                            Change Photo
                        </button>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                placeholder="Enter your name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                placeholder="Enter your email"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                value={profileData.location}
                                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                placeholder="City, State"
                            />
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={handleProfileSave}>
                        <Save size={16} />
                        Save Profile
                    </button>
                </div>
            </section>

            {/* Appearance Section */}
            <section className="settings-section">
                <h2><Moon size={20} /> Appearance</h2>
                <div className="settings-card">
                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">Dark Mode</span>
                            <span className="setting-desc">Switch between light and dark themes</span>
                        </div>
                        <button
                            className={`toggle-btn ${isDarkMode ? 'active' : ''}`}
                            onClick={toggleDarkMode}
                        >
                            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                            {isDarkMode ? 'Dark' : 'Light'}
                        </button>
                    </div>
                </div>
            </section>

            {/* Notifications Section */}
            <section className="settings-section">
                <h2><Bell size={20} /> Notification Preferences</h2>
                <div className="settings-card">
                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">Enable Weather Alerts</span>
                            <span className="setting-desc">Receive alerts for weather conditions</span>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={preferences.enableAlerts}
                                onChange={(e) => updatePreferences({ enableAlerts: e.target.checked })}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">Temperature Alerts</span>
                            <span className="setting-desc">Get notified about extreme temperatures</span>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={preferences.temperatureAlerts}
                                onChange={(e) => updatePreferences({ temperatureAlerts: e.target.checked })}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">Rainfall Alerts</span>
                            <span className="setting-desc">Get notified about heavy rainfall</span>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={preferences.rainfallAlerts}
                                onChange={(e) => updatePreferences({ rainfallAlerts: e.target.checked })}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>
            </section>

            {/* App Settings Section */}
            <section className="settings-section">
                <h2><Globe size={20} /> App Settings</h2>
                <div className="settings-card">
                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">Language</span>
                            <span className="setting-desc">Select your preferred language</span>
                        </div>
                        <select
                            value={appSettings.language}
                            onChange={(e) => setAppSettings({ ...appSettings, language: e.target.value })}
                            className="setting-select"
                        >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="mr">Marathi</option>
                            <option value="te">Telugu</option>
                            <option value="ta">Tamil</option>
                        </select>
                    </div>
                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">Units</span>
                            <span className="setting-desc">Temperature and measurement units</span>
                        </div>
                        <select
                            value={appSettings.units}
                            onChange={(e) => setAppSettings({ ...appSettings, units: e.target.value })}
                            className="setting-select"
                        >
                            <option value="metric">Metric (°C, km)</option>
                            <option value="imperial">Imperial (°F, mi)</option>
                        </select>
                    </div>
                    <div className="setting-row">
                        <div className="setting-info">
                            <span className="setting-label">Auto-detect Location</span>
                            <span className="setting-desc">Automatically detect your farm location</span>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={appSettings.autoDetectLocation}
                                onChange={(e) => setAppSettings({ ...appSettings, autoDetectLocation: e.target.checked })}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    <button className="btn btn-primary" onClick={handleAppSettingsSave}>
                        <Save size={16} />
                        Save Settings
                    </button>
                </div>
            </section>

            {/* Privacy Section */}
            <section className="settings-section">
                <h2><Shield size={20} /> Privacy & Data</h2>
                <div className="settings-card">
                    <div className="privacy-info">
                        <p>Your data is stored locally on your device. We do not collect or share your personal information.</p>
                        <div className="privacy-actions">
                            <button className="btn btn-secondary" onClick={() => {
                                if (window.confirm('Export all your data?')) {
                                    const data = {
                                        user: localStorage.getItem('geocrop_user'),
                                        farms: localStorage.getItem('myFarms'),
                                        predictions: localStorage.getItem('predictionHistory'),
                                        settings: localStorage.getItem('geocrop_app_settings')
                                    };
                                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'geocrop-data-export.json';
                                    a.click();
                                    toast.success('Data exported!');
                                }
                            }}>
                                Export My Data
                            </button>
                            <button className="btn btn-danger" onClick={() => {
                                if (window.confirm('Are you sure? This will delete all your local data.')) {
                                    localStorage.clear();
                                    toast.success('All data cleared. Refreshing...');
                                    setTimeout(() => window.location.reload(), 1500);
                                }
                            }}>
                                Clear All Data
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Settings;
