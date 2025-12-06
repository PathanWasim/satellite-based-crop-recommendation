import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin, Sprout, BarChart3, AlertTriangle, History, Loader2, Crosshair,
    Leaf, Droplets, Sun, TrendingUp, Zap, Shield, Globe, ArrowRight,
    CheckCircle, Star, Users, Award, Calendar, Bell
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '../components/Card';
import WeatherWidget from '../components/WeatherWidget';
import { useToast } from '../context/ToastContext';
import { useWeatherAlerts } from '../context/WeatherAlertsContext';
import { getHistoryCount, getPredictions } from '../services/historyService';
import './Dashboard.css';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const SEASONAL_CROPS = {
    'Winter': ['Wheat', 'Barley', 'Mustard', 'Peas'],
    'Summer': ['Rice', 'Maize', 'Cotton', 'Groundnut'],
    'Monsoon': ['Rice', 'Maize', 'Sorghum', 'Cotton'],
    'Autumn': ['Potato', 'Onion', 'Tomato', 'Cabbage']
};

const Dashboard = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { alerts, unreadCount, checkWeatherConditions } = useWeatherAlerts();

    const [farms, setFarms] = useState(() => {
        const saved = localStorage.getItem('myFarms');
        return saved ? JSON.parse(saved) : [];
    });

    const [historyCount, setHistoryCount] = useState(0);
    const [recentPredictions, setRecentPredictions] = useState([]);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [cropDistribution, setCropDistribution] = useState([]);
    const [currentSeason, setCurrentSeason] = useState('');
    const [weatherData, setWeatherData] = useState(null);

    const firstFarm = farms[0];
    const weatherLat = currentLocation?.lat || firstFarm?.coordinates?.lat || 28.6139;
    const weatherLon = currentLocation?.lng || firstFarm?.coordinates?.lng || 77.2090;

    // Fetch weather and check for alerts
    useEffect(() => {
        const fetchWeatherAndCheckAlerts = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/weather?lat=${weatherLat}&lon=${weatherLon}`);
                if (response.ok) {
                    const data = await response.json();
                    setWeatherData(data.current);

                    // Check for weather alerts
                    if (data.current) {
                        checkWeatherConditions({
                            temperature: data.current.temperature,
                            humidity: data.current.humidity,
                            windSpeed: data.current.wind_speed,
                            location: firstFarm?.name || 'Your Location'
                        });
                    }
                }
            } catch (error) {
                console.log('Weather fetch error:', error);
            }
        };

        fetchWeatherAndCheckAlerts();
    }, [weatherLat, weatherLon, checkWeatherConditions, firstFarm?.name]);

    useEffect(() => {
        setHistoryCount(getHistoryCount());
        const allPredictions = getPredictions();
        setRecentPredictions(allPredictions.slice(0, 3));

        // Calculate crop distribution
        const cropCounts = {};
        allPredictions.forEach(p => {
            const crop = p.prediction?.crop;
            if (crop) cropCounts[crop] = (cropCounts[crop] || 0) + 1;
        });
        const distribution = Object.entries(cropCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
        setCropDistribution(distribution);

        // Determine current season
        const month = new Date().getMonth();
        if (month >= 10 || month <= 1) setCurrentSeason('Winter');
        else if (month >= 2 && month <= 4) setCurrentSeason('Summer');
        else if (month >= 5 && month <= 8) setCurrentSeason('Monsoon');
        else setCurrentSeason('Autumn');

        if (navigator.geolocation && !firstFarm) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                () => { }
            );
        }
    }, []);

    const handleAutoDetect = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newFarm = {
                    id: Date.now(),
                    name: `My Location`,
                    area: '0 acres',
                    soilType: 'Unknown',
                    coordinates: { lat: latitude, lng: longitude }
                };

                const updatedFarms = [...farms, newFarm];
                setFarms(updatedFarms);
                localStorage.setItem('myFarms', JSON.stringify(updatedFarms));
                setCurrentLocation({ lat: latitude, lng: longitude });
                toast.success('Location detected! Farm added successfully.');
                setDetectingLocation(false);
            },
            () => {
                setDetectingLocation(false);
                toast.error('Unable to detect location. Please enable GPS.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const features = [
        { icon: Zap, title: 'AI-Powered', desc: 'Deep learning model' },
        { icon: Globe, title: 'Satellite Data', desc: 'Sentinel-2 imagery' },
        { icon: Shield, title: 'Real-Time', desc: 'Instant predictions' },
        { icon: Droplets, title: 'Weather Aware', desc: 'Live weather data' }
    ];

    // Dynamic stats based on actual user data
    const stats = [
        { value: historyCount.toString(), label: 'Your Predictions', icon: TrendingUp },
        { value: farms.length.toString(), label: 'Registered Farms', icon: MapPin },
        { value: '12', label: 'Crop Types', icon: Leaf },
        { value: '5-Day', label: 'Weather Forecast', icon: Sun }
    ];

    const quickActions = [
        {
            icon: MapPin,
            title: 'Add Your Farmland',
            subtitle: 'Register your farm with satellite imagery',
            color: 'green',
            path: '/farms',
            badge: 'Popular'
        },
        {
            icon: Sprout,
            title: 'Predict Crop Type',
            subtitle: 'Get AI recommendations for best crops',
            color: 'green',
            path: '/predictions',
            badge: 'AI Powered'
        },
        {
            icon: History,
            title: 'Prediction History',
            subtitle: `${historyCount} predictions recorded`,
            color: 'blue',
            path: '/history'
        },
        {
            icon: BarChart3,
            title: 'Analytics & Reports',
            subtitle: 'Detailed yield and health reports',
            color: 'purple',
            path: '/reports'
        }
    ];

    const getCropIcon = (crop) => {
        const icons = { 'Wheat': '🌾', 'Rice': '🌾', 'Maize': '🌽', 'Forest': '🌲' };
        return icons[crop] || '🌱';
    };

    return (
        <div className="dashboard">
            {/* Weather Alerts Banner */}
            {unreadCount > 0 && (
                <div className="alerts-banner" onClick={() => navigate('/alerts')}>
                    <div className="alerts-banner-content">
                        <AlertTriangle size={20} />
                        <span>
                            <strong>{unreadCount} Weather Alert{unreadCount > 1 ? 's' : ''}</strong>
                            {' '}- {alerts[0]?.title}
                        </span>
                    </div>
                    <button className="alerts-banner-btn">
                        View Alerts <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-bg-pattern"></div>
                <div className="hero-content">
                    <div className="hero-text">
                        <div className="hero-badge">
                            <Sprout size={16} />
                            <span>GeoCrop Predictor</span>
                        </div>
                        <h1 className="hero-title">
                            Smart Crop Predictions
                            <span className="title-highlight"> Using AI & Satellite Data</span>
                        </h1>
                        <p className="hero-subtitle">
                            Analyze your farmland using real Sentinel-2 satellite imagery combined with
                            soil and weather data. Get personalized crop recommendations powered by deep learning.
                        </p>

                        <div className="hero-cta">
                            <button
                                className="btn btn-hero-primary"
                                onClick={() => navigate('/predictions')}
                            >
                                <Sprout size={20} />
                                Start Prediction
                                <ArrowRight size={18} />
                            </button>
                            <button
                                className="btn btn-hero-secondary"
                                onClick={handleAutoDetect}
                                disabled={detectingLocation}
                            >
                                {detectingLocation ? (
                                    <Loader2 size={20} className="spinning" />
                                ) : (
                                    <Crosshair size={20} />
                                )}
                                {detectingLocation ? 'Detecting...' : 'Detect My Farm'}
                            </button>
                        </div>

                        <div className="hero-features">
                            {features.map((feature, i) => (
                                <div key={i} className="hero-feature">
                                    <feature.icon size={18} />
                                    <div>
                                        <span className="feature-title">{feature.title}</span>
                                        <span className="feature-desc">{feature.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="hero-card-stack">
                            <div className="hero-preview-card main">
                                <div className="preview-header">
                                    <span className="preview-badge success">🌾 Wheat Recommended</span>
                                    <span className="preview-confidence">94%</span>
                                </div>
                                <div className="preview-body">
                                    <div className="preview-stat">
                                        <Sun size={16} />
                                        <span>Optimal Season</span>
                                    </div>
                                    <div className="preview-stat">
                                        <Droplets size={16} />
                                        <span>Good Rainfall</span>
                                    </div>
                                    <div className="preview-stat">
                                        <Leaf size={16} />
                                        <span>Soil Match: 92%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="hero-preview-card secondary">
                                <div className="mini-map"></div>
                            </div>
                        </div>
                        <div className="floating-elements">
                            <div className="float-item item-1">🌾</div>
                            <div className="float-item item-2">🌽</div>
                            <div className="float-item item-3">🌱</div>
                            <div className="float-item item-4">☀️</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="stats-bar">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <stat.icon size={24} className="stat-icon" />
                        <div className="stat-info">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </section>

            {/* Quick Actions */}
            <section className="section">
                <div className="section-header">
                    <div>
                        <h2 className="section-title">Quick Actions</h2>
                        <p className="section-subtitle">Everything you need to manage your farm</p>
                    </div>
                    <button className="btn btn-text" onClick={() => navigate('/farms')}>
                        View All <ArrowRight size={16} />
                    </button>
                </div>

                <div className="actions-grid">
                    {quickActions.map((action, index) => (
                        <div
                            key={index}
                            className={`action-card action-${action.color}`}
                            onClick={() => navigate(action.path)}
                        >
                            {action.badge && (
                                <span className="action-badge">{action.badge}</span>
                            )}
                            <div className="action-icon">
                                <action.icon size={28} />
                            </div>
                            <h3 className="action-title">{action.title}</h3>
                            <p className="action-subtitle">{action.subtitle}</p>
                            <div className="action-arrow">
                                <ArrowRight size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Farm Overview & Weather */}
            <section className="section dual-section">
                <div className="farm-overview">
                    <div className="overview-header">
                        <h3>
                            <MapPin size={20} />
                            Your Farms
                        </h3>
                        <button className="btn btn-sm" onClick={() => navigate('/farms')}>
                            Manage
                        </button>
                    </div>

                    {farms.length === 0 ? (
                        <div className="empty-farms">
                            <div className="empty-icon">🌍</div>
                            <h4>No Farms Yet</h4>
                            <p>Add your first farm to get started with predictions</p>
                            <button className="btn btn-primary" onClick={() => navigate('/farms')}>
                                <MapPin size={18} />
                                Add Farm
                            </button>
                        </div>
                    ) : (
                        <div className="farms-list-mini">
                            {farms.slice(0, 3).map((farm, i) => (
                                <div key={i} className="farm-mini-card">
                                    <div className="farm-mini-icon">
                                        <MapPin size={18} />
                                    </div>
                                    <div className="farm-mini-info">
                                        <span className="farm-mini-name">{farm.name}</span>
                                        <span className="farm-mini-coords">
                                            {farm.coordinates.lat.toFixed(2)}°N, {farm.coordinates.lng.toFixed(2)}°E
                                        </span>
                                    </div>
                                    <CheckCircle size={18} className="farm-check" />
                                </div>
                            ))}
                            {farms.length > 3 && (
                                <div className="farms-more">+{farms.length - 3} more farms</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="weather-section">
                    <WeatherWidget lat={weatherLat} lon={weatherLon} />
                </div>
            </section>

            {/* Recent Predictions */}
            {recentPredictions.length > 0 && (
                <section className="section">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Recent Predictions</h2>
                            <p className="section-subtitle">Your latest crop recommendations</p>
                        </div>
                        <button className="btn btn-text" onClick={() => navigate('/history')}>
                            View All <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="predictions-grid">
                        {recentPredictions.map((pred, i) => (
                            <div key={i} className="prediction-card">
                                <div className="pred-icon">{getCropIcon(pred.prediction?.crop)}</div>
                                <div className="pred-info">
                                    <span className="pred-crop">{pred.prediction?.crop || 'Unknown'}</span>
                                    <span className="pred-farm">{pred.farmName}</span>
                                </div>
                                <div className="pred-confidence">
                                    {pred.prediction?.confidence || 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Analytics & Seasonal Section */}
            <section className="section analytics-section">
                <div className="analytics-grid">
                    {/* Crop Distribution Chart */}
                    <div className="analytics-card">
                        <h3><BarChart3 size={20} /> Top Recommended Crops</h3>
                        {cropDistribution.length > 0 ? (
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={cropDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {cropDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="no-data-msg">
                                <Sprout size={32} />
                                <p>Make predictions to see analytics</p>
                            </div>
                        )}
                    </div>

                    {/* Seasonal Recommendations */}
                    <div className="analytics-card seasonal-card">
                        <h3><Calendar size={20} /> {currentSeason} Season Crops</h3>
                        <p className="seasonal-subtitle">Recommended crops for current season</p>
                        <div className="seasonal-tags">
                            {SEASONAL_CROPS[currentSeason]?.map((crop, i) => (
                                <span key={i} className="seasonal-tag">🌱 {crop}</span>
                            ))}
                        </div>
                        <div className="seasonal-tip">
                            💡 Plant these crops now for optimal yield based on {currentSeason} weather patterns.
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to optimize your harvest?</h2>
                    <p>Start making data-driven decisions for your farmland today.</p>
                    <button className="btn btn-cta" onClick={() => navigate('/predictions')}>
                        <Sprout size={20} />
                        Get Your First Prediction
                        <ArrowRight size={18} />
                    </button>
                </div>
                <div className="cta-decoration">
                    <div className="cta-circle"></div>
                    <div className="cta-circle"></div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
