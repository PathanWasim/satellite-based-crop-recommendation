import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WeatherAlertsContext = createContext(null);

export const useWeatherAlerts = () => {
    const context = useContext(WeatherAlertsContext);
    if (!context) throw new Error('useWeatherAlerts must be used within WeatherAlertsProvider');
    return context;
};

// Alert types and thresholds
const ALERT_THRESHOLDS = {
    temperature: { high: 40, low: 5 },
    humidity: { high: 90, low: 20 },
    rainfall: { heavy: 50 },
    wind: { high: 40 }
};

export const WeatherAlertsProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const [preferences, setPreferences] = useState({
        enableAlerts: true,
        temperatureAlerts: true,
        humidityAlerts: true,
        rainfallAlerts: true,
        windAlerts: true
    });

    // Load alerts and preferences from localStorage
    useEffect(() => {
        const savedAlerts = localStorage.getItem('geocrop_weather_alerts');
        const savedPrefs = localStorage.getItem('geocrop_alert_preferences');

        if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
        if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
    }, []);

    // Save alerts to localStorage
    useEffect(() => {
        localStorage.setItem('geocrop_weather_alerts', JSON.stringify(alerts));
    }, [alerts]);

    // Save preferences to localStorage
    useEffect(() => {
        localStorage.setItem('geocrop_alert_preferences', JSON.stringify(preferences));
    }, [preferences]);


    // Generate alert based on weather conditions
    const generateAlert = useCallback((type, severity, title, message, location = 'Your Area') => {
        const newAlert = {
            id: Date.now() + Math.random(),
            type,
            severity, // 'high', 'medium', 'low'
            title,
            message,
            location,
            timestamp: new Date().toISOString(),
            read: false
        };
        return newAlert;
    }, []);

    // Check weather conditions and generate alerts
    const checkWeatherConditions = useCallback((weatherData) => {
        if (!preferences.enableAlerts) return;

        const newAlerts = [];
        const { temperature, humidity, rainfall, windSpeed, location } = weatherData;

        // Temperature alerts
        if (preferences.temperatureAlerts && temperature !== undefined) {
            if (temperature >= ALERT_THRESHOLDS.temperature.high) {
                newAlerts.push(generateAlert(
                    'temperature',
                    'high',
                    '🌡️ Extreme Heat Warning',
                    `Temperature is ${temperature}°C. Protect crops from heat stress and ensure adequate irrigation.`,
                    location
                ));
            } else if (temperature <= ALERT_THRESHOLDS.temperature.low) {
                newAlerts.push(generateAlert(
                    'temperature',
                    'high',
                    '❄️ Frost Warning',
                    `Temperature is ${temperature}°C. Risk of frost damage to crops. Consider protective measures.`,
                    location
                ));
            }
        }

        // Humidity alerts
        if (preferences.humidityAlerts && humidity !== undefined) {
            if (humidity >= ALERT_THRESHOLDS.humidity.high) {
                newAlerts.push(generateAlert(
                    'humidity',
                    'medium',
                    '💧 High Humidity Alert',
                    `Humidity is ${humidity}%. Increased risk of fungal diseases. Monitor crops closely.`,
                    location
                ));
            } else if (humidity <= ALERT_THRESHOLDS.humidity.low) {
                newAlerts.push(generateAlert(
                    'humidity',
                    'medium',
                    '🏜️ Low Humidity Warning',
                    `Humidity is ${humidity}%. Crops may need additional watering.`,
                    location
                ));
            }
        }

        // Rainfall alerts
        if (preferences.rainfallAlerts && rainfall !== undefined) {
            if (rainfall >= ALERT_THRESHOLDS.rainfall.heavy) {
                newAlerts.push(generateAlert(
                    'rainfall',
                    'high',
                    '🌧️ Heavy Rainfall Alert',
                    `Expected rainfall: ${rainfall}mm. Check drainage systems and protect sensitive crops.`,
                    location
                ));
            }
        }

        // Wind alerts
        if (preferences.windAlerts && windSpeed !== undefined) {
            if (windSpeed >= ALERT_THRESHOLDS.wind.high) {
                newAlerts.push(generateAlert(
                    'wind',
                    'medium',
                    '💨 Strong Wind Warning',
                    `Wind speed: ${windSpeed} km/h. Secure loose structures and protect tall crops.`,
                    location
                ));
            }
        }

        if (newAlerts.length > 0) {
            setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep max 50 alerts
        }

        return newAlerts;
    }, [preferences, generateAlert]);

    // Add a custom alert
    const addAlert = useCallback((alert) => {
        const newAlert = {
            ...alert,
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            read: false
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 50));
    }, []);

    // Mark alert as read
    const markAsRead = useCallback((alertId) => {
        setAlerts(prev => prev.map(alert =>
            alert.id === alertId ? { ...alert, read: true } : alert
        ));
    }, []);

    // Mark all alerts as read
    const markAllAsRead = useCallback(() => {
        setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
    }, []);

    // Dismiss an alert
    const dismissAlert = useCallback((alertId) => {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }, []);

    // Clear all alerts
    const clearAllAlerts = useCallback(() => {
        setAlerts([]);
    }, []);

    // Update preferences
    const updatePreferences = useCallback((newPrefs) => {
        setPreferences(prev => ({ ...prev, ...newPrefs }));
    }, []);

    // Get unread count
    const unreadCount = alerts.filter(a => !a.read).length;

    return (
        <WeatherAlertsContext.Provider value={{
            alerts,
            unreadCount,
            preferences,
            checkWeatherConditions,
            addAlert,
            markAsRead,
            markAllAsRead,
            dismissAlert,
            clearAllAlerts,
            updatePreferences
        }}>
            {children}
        </WeatherAlertsContext.Provider>
    );
};
