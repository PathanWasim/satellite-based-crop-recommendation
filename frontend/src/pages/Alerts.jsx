import React from 'react';
import { AlertTriangle, Bell, Thermometer, Droplets, Wind, Cloud, Trash2, CheckCircle } from 'lucide-react';
import { useWeatherAlerts } from '../context/WeatherAlertsContext';
import { useToast } from '../context/ToastContext';
import './Alerts.css';

const Alerts = () => {
    const {
        alerts,
        unreadCount,
        preferences,
        updatePreferences,
        markAllAsRead,
        clearAllAlerts,
        addAlert
    } = useWeatherAlerts();
    const toast = useToast();

    const handleTestAlert = (type) => {
        const testAlerts = {
            temperature: {
                type: 'temperature',
                severity: 'high',
                title: '🌡️ Test: Extreme Heat Warning',
                message: 'Temperature is 42°C. Protect crops from heat stress.',
                location: 'Test Farm'
            },
            humidity: {
                type: 'humidity',
                severity: 'medium',
                title: '💧 Test: High Humidity Alert',
                message: 'Humidity is 95%. Increased risk of fungal diseases.',
                location: 'Test Farm'
            },
            rainfall: {
                type: 'rainfall',
                severity: 'high',
                title: '🌧️ Test: Heavy Rainfall Alert',
                message: 'Expected rainfall: 75mm. Check drainage systems.',
                location: 'Test Farm'
            },
            wind: {
                type: 'wind',
                severity: 'medium',
                title: '💨 Test: Strong Wind Warning',
                message: 'Wind speed: 55 km/h. Secure loose structures.',
                location: 'Test Farm'
            }
        };

        addAlert(testAlerts[type]);
        toast.success(`Test ${type} alert created!`);
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'var(--error)';
            case 'medium': return '#f59e0b';
            default: return 'var(--green-500)';
        }
    };

    return (
        <div className="alerts-page">
            <div className="alerts-header">
                <div className="alerts-title">
                    <AlertTriangle size={28} />
                    <h1>Weather Alerts</h1>
                    {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount} unread</span>
                    )}
                </div>
                <p>Monitor weather conditions and receive alerts for your farms</p>
            </div>

            {/* Test Alerts Section */}
            <section className="alerts-section">
                <h2>🧪 Test Alerts</h2>
                <p className="section-desc">Generate test alerts to see how the notification system works</p>
                <div className="test-buttons">
                    <button className="test-btn temp" onClick={() => handleTestAlert('temperature')}>
                        <Thermometer size={20} />
                        Temperature Alert
                    </button>
                    <button className="test-btn humidity" onClick={() => handleTestAlert('humidity')}>
                        <Droplets size={20} />
                        Humidity Alert
                    </button>
                    <button className="test-btn rain" onClick={() => handleTestAlert('rainfall')}>
                        <Cloud size={20} />
                        Rainfall Alert
                    </button>
                    <button className="test-btn wind" onClick={() => handleTestAlert('wind')}>
                        <Wind size={20} />
                        Wind Alert
                    </button>
                </div>
            </section>

            {/* Preferences Section */}
            <section className="alerts-section">
                <h2>⚙️ Alert Preferences</h2>
                <div className="preferences-grid">
                    <label className="pref-item">
                        <input
                            type="checkbox"
                            checked={preferences.enableAlerts}
                            onChange={(e) => updatePreferences({ enableAlerts: e.target.checked })}
                        />
                        <span>Enable Weather Alerts</span>
                    </label>
                    <label className="pref-item">
                        <input
                            type="checkbox"
                            checked={preferences.temperatureAlerts}
                            onChange={(e) => updatePreferences({ temperatureAlerts: e.target.checked })}
                        />
                        <span>Temperature Alerts</span>
                    </label>
                    <label className="pref-item">
                        <input
                            type="checkbox"
                            checked={preferences.humidityAlerts}
                            onChange={(e) => updatePreferences({ humidityAlerts: e.target.checked })}
                        />
                        <span>Humidity Alerts</span>
                    </label>
                    <label className="pref-item">
                        <input
                            type="checkbox"
                            checked={preferences.rainfallAlerts}
                            onChange={(e) => updatePreferences({ rainfallAlerts: e.target.checked })}
                        />
                        <span>Rainfall Alerts</span>
                    </label>
                    <label className="pref-item">
                        <input
                            type="checkbox"
                            checked={preferences.windAlerts}
                            onChange={(e) => updatePreferences({ windAlerts: e.target.checked })}
                        />
                        <span>Wind Alerts</span>
                    </label>
                </div>
            </section>

            {/* Alerts List */}
            <section className="alerts-section">
                <div className="section-header">
                    <h2>📋 Alert History</h2>
                    <div className="section-actions">
                        <button className="btn btn-secondary" onClick={markAllAsRead}>
                            <CheckCircle size={16} />
                            Mark All Read
                        </button>
                        <button className="btn btn-danger" onClick={clearAllAlerts}>
                            <Trash2 size={16} />
                            Clear All
                        </button>
                    </div>
                </div>

                {alerts.length === 0 ? (
                    <div className="empty-alerts">
                        <Bell size={48} />
                        <h3>No Alerts</h3>
                        <p>Weather alerts will appear here when conditions require attention</p>
                    </div>
                ) : (
                    <div className="alerts-list">
                        {alerts.map(alert => (
                            <div
                                key={alert.id}
                                className={`alert-card ${alert.severity} ${alert.read ? 'read' : 'unread'}`}
                            >
                                <div
                                    className="alert-severity-bar"
                                    style={{ backgroundColor: getSeverityColor(alert.severity) }}
                                />
                                <div className="alert-content">
                                    <div className="alert-header">
                                        <span className="alert-title">{alert.title}</span>
                                        <span className={`severity-badge ${alert.severity}`}>
                                            {alert.severity}
                                        </span>
                                    </div>
                                    <p className="alert-message">{alert.message}</p>
                                    <div className="alert-meta">
                                        <span>📍 {alert.location}</span>
                                        <span>🕐 {formatTime(alert.timestamp)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Alerts;
