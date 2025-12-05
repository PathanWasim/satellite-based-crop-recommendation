import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Droplets, Wind, Thermometer, AlertCircle, RefreshCw } from 'lucide-react';
import { useWeatherAlerts } from '../context/WeatherAlertsContext';
import './WeatherWidget.css';

const CACHE_KEY = 'weatherCache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in ms

// Weather icon mapping
const getWeatherEmoji = (icon) => {
    const iconMap = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️',
    };
    return iconMap[icon] || '🌤️';
};

const WeatherWidget = ({ lat, lon, compact = false }) => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { checkWeatherConditions } = useWeatherAlerts();
    const alertsCheckedRef = useRef(false);

    // Check cache
    const getCachedWeather = () => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const { timestamp, lat: cachedLat, lon: cachedLon, data } = JSON.parse(cached);
            const age = Date.now() - timestamp;

            // Check if cache is valid (same location and not expired)
            if (age < CACHE_DURATION &&
                Math.abs(cachedLat - lat) < 0.1 &&
                Math.abs(cachedLon - lon) < 0.1) {
                return data;
            }
            return null;
        } catch {
            return null;
        }
    };

    // Save to cache
    const saveToCache = (data) => {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                lat,
                lon,
                data
            }));
        } catch (e) {
            console.warn('Failed to cache weather data:', e);
        }
    };

    const fetchWeather = async () => {
        if (!lat || !lon) {
            setError('No location provided');
            setLoading(false);
            return;
        }

        // Check cache first
        const cached = getCachedWeather();
        if (cached) {
            setWeather(cached);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `http://localhost:5000/api/weather?lat=${lat}&lon=${lon}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch weather');
            }

            const data = await response.json();
            setWeather(data);
            saveToCache(data);

            // Check for weather alerts (only once per session)
            if (!alertsCheckedRef.current && data.current) {
                alertsCheckedRef.current = true;
                checkWeatherConditions({
                    temperature: data.current.temperature,
                    humidity: data.current.humidity,
                    windSpeed: data.current.wind_speed,
                    rainfall: data.current.rainfall || 0,
                    location: 'Your Farm Location'
                });
            }
        } catch (err) {
            console.error('Weather fetch error:', err);
            setError(err.message || 'Weather unavailable');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
    }, [lat, lon]);

    // Loading state
    if (loading) {
        return (
            <div className={`weather-widget ${compact ? 'compact' : ''}`}>
                <div className="weather-loading">
                    <div className="weather-skeleton header"></div>
                    <div className="weather-skeleton temp"></div>
                    <div className="weather-skeleton details"></div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`weather-widget ${compact ? 'compact' : ''} error`}>
                <div className="weather-error">
                    <AlertCircle size={24} />
                    <p>{error}</p>
                    <button className="retry-btn" onClick={fetchWeather}>
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!weather) return null;

    const { current, forecast } = weather;

    return (
        <div className={`weather-widget ${compact ? 'compact' : ''}`}>
            <div className="weather-header">
                <h3>Weather Insights</h3>
                <p className="weather-location">Farm Location</p>
            </div>

            <div className="weather-current">
                <div className="weather-temp">
                    <span className="temp-value">{Math.round(current.temperature)}°</span>
                    <span className="temp-unit">C</span>
                </div>
                <div className="weather-condition">
                    <div className="weather-icon">{getWeatherEmoji(current.icon)}</div>
                    <p>{current.description}</p>
                </div>
            </div>

            <div className="weather-details">
                <div className="weather-detail">
                    <Droplets size={18} />
                    <span className="detail-label">Humidity</span>
                    <span className="detail-value">{current.humidity}%</span>
                </div>
                <div className="weather-detail">
                    <Wind size={18} />
                    <span className="detail-label">Wind</span>
                    <span className="detail-value">{current.wind_speed} km/h</span>
                </div>
                <div className="weather-detail">
                    <Thermometer size={18} />
                    <span className="detail-label">Feels</span>
                    <span className="detail-value">{Math.round(current.temperature)}°C</span>
                </div>
            </div>

            {!compact && forecast && forecast.length > 0 && (
                <div className="weather-forecast">
                    <h4>5-Day Forecast</h4>
                    <div className="forecast-days">
                        {forecast.slice(0, 5).map((day, i) => {
                            const date = new Date(day.date);
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                            return (
                                <div key={i} className="forecast-day">
                                    <span className="day-name">{dayName}</span>
                                    <span className="day-icon">{getWeatherEmoji(day.icon)}</span>
                                    <span className="day-temp">
                                        {Math.round(day.temp_high)}° / {Math.round(day.temp_low)}°
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeatherWidget;
