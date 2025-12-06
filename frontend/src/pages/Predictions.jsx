import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sprout, Beaker, Cloud, Settings, Sparkles, MapPin, Loader2, Crosshair,
    CheckCircle, Circle, Image, Database, Cpu, FileText, ArrowRight
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { savePrediction } from '../services/historyService';
import './Predictions.css';

// Prediction steps configuration
const PREDICTION_STEPS = [
    { id: 1, name: 'Fetching Satellite Image', icon: Image, description: 'Retrieving satellite imagery for your location' },
    { id: 2, name: 'Data Validation', icon: Database, description: 'Validating soil and weather parameters' },
    { id: 3, name: 'Image Analysis', icon: Image, description: 'Processing satellite image through CNN' },
    { id: 4, name: 'Feature Extraction', icon: Cpu, description: 'Extracting features from image and tabular data' },
    { id: 5, name: 'Model Inference', icon: Sparkles, description: 'Running LiteGeoNet prediction model' },
    { id: 6, name: 'Generating Results', icon: FileText, description: 'Creating recommendations and yield estimates' }
];

const Predictions = () => {
    const navigate = useNavigate();
    const toast = useToast();

    // Load real farms from localStorage
    const [farms, setFarms] = useState(() => {
        const saved = localStorage.getItem('myFarms');
        return saved ? JSON.parse(saved) : [];
    });

    const [selectedFarm, setSelectedFarm] = useState(farms[0]?.name || '');
    const [soilParams, setSoilParams] = useState({
        ph: 6.5,
        N: 50,
        P: 40,
        K: 45
    });
    const [weatherParams, setWeatherParams] = useState({
        rainfall: 800,
        temperature: 28
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [loading, setLoading] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);

    // Step-by-step prediction state
    const [showPredictionModal, setShowPredictionModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [stepStatuses, setStepStatuses] = useState({});
    const [predictionResult, setPredictionResult] = useState(null);

    // Update farms when localStorage changes
    useEffect(() => {
        const handleStorageChange = () => {
            const saved = localStorage.getItem('myFarms');
            if (saved) {
                const loadedFarms = JSON.parse(saved);
                setFarms(loadedFarms);
                if (!selectedFarm && loadedFarms.length > 0) {
                    setSelectedFarm(loadedFarms[0].name);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [selectedFarm]);

    // Auto-detect location and add as farm
    const handleAutoDetect = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                const existingFarm = farms.find(f =>
                    Math.abs(f.coordinates.lat - latitude) < 0.01 &&
                    Math.abs(f.coordinates.lng - longitude) < 0.01
                );

                if (existingFarm) {
                    setSelectedFarm(existingFarm.name);
                    toast.info(`Selected existing farm: ${existingFarm.name}`);
                } else {
                    const newFarm = {
                        id: Date.now(),
                        name: `My Location (${latitude.toFixed(2)}°N)`,
                        area: '0 acres',
                        areaValue: 0,
                        soilType: 'Unknown',
                        coordinates: { lat: latitude, lng: longitude }
                    };

                    const updatedFarms = [...farms, newFarm];
                    setFarms(updatedFarms);
                    localStorage.setItem('myFarms', JSON.stringify(updatedFarms));
                    setSelectedFarm(newFarm.name);
                    toast.success(`Location detected! Added as "${newFarm.name}"`);
                }
                setDetectingLocation(false);
            },
            (error) => {
                setDetectingLocation(false);
                toast.error('Unable to detect location.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // Get pH status color and label
    const getPhStatus = (ph) => {
        if (ph < 5.5) return { color: '#ef4444', label: 'Too Acidic' };
        if (ph > 7.5) return { color: '#ef4444', label: 'Too Alkaline' };
        if (ph >= 6.0 && ph <= 7.0) return { color: '#22c55e', label: 'Optimal' };
        return { color: '#f59e0b', label: 'Acceptable' };
    };

    // Get nutrient status
    const getNutrientStatus = (value, type) => {
        const ranges = {
            N: { low: 30, optimal: 60, high: 120 },
            P: { low: 20, optimal: 40, high: 80 },
            K: { low: 20, optimal: 40, high: 80 }
        };
        const range = ranges[type];
        if (value < range.low) return { color: '#ef4444', label: 'Low' };
        if (value > range.high) return { color: '#f59e0b', label: 'High' };
        return { color: '#22c55e', label: 'Good' };
    };

    // Update step status with animation
    const updateStep = (stepId, status, duration = null) => {
        setStepStatuses(prev => ({
            ...prev,
            [stepId]: { status, duration }
        }));
        if (status === 'completed') {
            setCurrentStep(stepId);
        }
    };

    // Simulate step delay for visual feedback
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handlePredict = async () => {
        if (farms.length === 0) {
            toast.error('Please add a farm first in the My Farms page!');
            return;
        }

        const farm = farms.find(f => f.name === selectedFarm);
        if (!farm) {
            toast.error('Please select a farm first');
            return;
        }

        // Reset and show modal
        setLoading(true);
        setShowPredictionModal(true);
        setCurrentStep(0);
        setStepStatuses({});
        setPredictionResult(null);

        const lat = farm.coordinates.lat;
        const lon = farm.coordinates.lng;

        try {
            // Step 1: Fetch satellite image
            updateStep(1, 'processing');
            await delay(300);

            const imageResponse = await fetch(`http://localhost:5000/get_sample_image?lat=${lat}&lon=${lon}`);
            if (!imageResponse.ok) throw new Error('Failed to fetch satellite image');
            const imageBlob = await imageResponse.blob();

            updateStep(1, 'completed', 'Image retrieved');
            await delay(200);

            // Step 2: Data validation
            updateStep(2, 'processing');
            await delay(400);
            updateStep(2, 'completed', 'Parameters validated');
            await delay(200);

            // Step 3: Prepare form data
            updateStep(3, 'processing');
            const formData = new FormData();
            formData.append('image', imageBlob, 'satellite.png');
            formData.append('ph', soilParams.ph);
            formData.append('N', soilParams.N);
            formData.append('P', soilParams.P);
            formData.append('K', soilParams.K);
            formData.append('rainfall', weatherParams.rainfall);
            formData.append('temp', weatherParams.temperature);
            formData.append('lat', lat);
            formData.append('lon', lon);
            formData.append('area', farm.areaValue || 0);
            if (farm.boundary) {
                formData.append('boundary', JSON.stringify(farm.boundary));
            }

            await delay(500);
            updateStep(3, 'completed', 'Image processed');
            await delay(200);

            // Step 4: Feature extraction (simulated timing)
            updateStep(4, 'processing');
            await delay(400);
            updateStep(4, 'completed', 'Features extracted');
            await delay(200);

            // Step 5: Model inference
            updateStep(5, 'processing');

            const response = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Prediction failed');
            const result = await response.json();

            updateStep(5, 'completed', `${result.processing?.total_time_ms || 0}ms`);
            await delay(200);

            // Step 6: Generate results
            updateStep(6, 'processing');
            await delay(300);
            updateStep(6, 'completed', 'Complete');

            setPredictionResult(result);

            // Save prediction to history
            savePrediction({
                farmName: farm.name,
                farmCoordinates: farm.coordinates,
                farmArea: farm.areaValue || 0,
                soilParams: soilParams,
                weatherParams: weatherParams,
                prediction: result
            });

            // Auto-navigate to results after short delay
            await delay(500);
            setShowPredictionModal(false);
            navigate('/results', {
                state: {
                    farm: farm,
                    soil: soilParams,
                    weather: weatherParams,
                    prediction: result
                }
            });

        } catch (error) {
            console.error('Prediction error:', error);
            toast.error('Failed to get prediction. Please make sure the backend is running.');
            setShowPredictionModal(false);
        } finally {
            setLoading(false);
        }
    };

    const handleViewResults = () => {
        const farm = farms.find(f => f.name === selectedFarm);
        setShowPredictionModal(false);
        navigate('/results', {
            state: {
                farm: farm,
                soil: soilParams,
                weather: weatherParams,
                prediction: predictionResult
            }
        });
    };

    const getStepIcon = (step, status) => {
        if (status?.status === 'completed') {
            return <CheckCircle size={20} className="step-icon completed" />;
        }
        if (status?.status === 'processing') {
            return <Loader2 size={20} className="step-icon processing spinning" />;
        }
        return <Circle size={20} className="step-icon pending" />;
    };

    return (
        <div className="predictions">
            <div className="predictions-header">
                <div className="header-icon">
                    <Sprout size={32} />
                </div>
                <div>
                    <h1 className="page-title">Crop Prediction</h1>
                    <p className="page-subtitle">Enter your farm details to get AI-powered crop recommendations</p>
                </div>
            </div>

            <div className="prediction-form">
                {/* Farm Selection */}
                <div className="form-section">
                    <div className="section-icon">
                        <Sprout size={20} />
                    </div>
                    <div className="section-content">
                        <h3 className="section-title">Select Farm</h3>
                        <p className="section-subtitle">Choose the farmland for prediction</p>

                        <div className="farm-selection-actions">
                            <button
                                className="btn btn-secondary auto-detect-btn"
                                onClick={handleAutoDetect}
                                disabled={detectingLocation}
                            >
                                {detectingLocation ? (
                                    <>
                                        <Loader2 size={18} className="spinning" />
                                        Detecting...
                                    </>
                                ) : (
                                    <>
                                        <Crosshair size={18} />
                                        Auto-Detect My Location
                                    </>
                                )}
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/farms')}>
                                <MapPin size={18} />
                                Add Farm Manually
                            </button>
                        </div>

                        {farms.length === 0 ? (
                            <div className="no-farms-message">
                                <p>No farms registered yet. Use auto-detect or add a farm manually!</p>
                            </div>
                        ) : (
                            <>
                                <div className="farm-cards">
                                    {farms.map(farm => (
                                        <div
                                            key={farm.id}
                                            className={`farm-card ${selectedFarm === farm.name ? 'selected' : ''}`}
                                            onClick={() => setSelectedFarm(farm.name)}
                                        >
                                            <div className="farm-card-icon">
                                                <MapPin size={20} />
                                            </div>
                                            <div className="farm-card-name">{farm.name}</div>
                                            <div className="farm-card-area">{farm.area}</div>
                                            <div className="farm-card-coords">
                                                {farm.coordinates.lat.toFixed(4)}°N, {farm.coordinates.lng.toFixed(4)}°E
                                            </div>
                                            {farm.boundary && (
                                                <div className="farm-card-boundary">📐 Boundary mapped</div>
                                            )}
                                            {selectedFarm === farm.name && (
                                                <div className="farm-card-selected-badge">Selected</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="total-farms-info">
                                    <span className="total-label">Total Farms: {farms.length}</span>
                                    <span className="total-area">
                                        Total Area: {farms.reduce((sum, f) => sum + (f.areaValue || 0), 0).toFixed(1)} acres
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Soil Parameters */}
                <div className="form-section">
                    <div className="section-icon">
                        <Beaker size={20} />
                    </div>
                    <div className="section-content">
                        <h3 className="section-title">Soil Parameters</h3>
                        <p className="section-subtitle">Adjust soil quality indicators</p>

                        <div className="parameters-grid">
                            <div className="parameter">
                                <div className="parameter-header">
                                    <label>pH Level</label>
                                    <div className="parameter-value-group">
                                        <span className="parameter-value">{soilParams.ph}</span>
                                        <span className="parameter-status" style={{ color: getPhStatus(soilParams.ph).color }}>
                                            {getPhStatus(soilParams.ph).label}
                                        </span>
                                    </div>
                                </div>
                                <div className="slider-container">
                                    <div className="slider-track ph-track">
                                        <div
                                            className="slider-fill"
                                            style={{
                                                width: `${((soilParams.ph - 4) / 5) * 100}%`,
                                                background: getPhStatus(soilParams.ph).color
                                            }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="4"
                                        max="9"
                                        step="0.1"
                                        value={soilParams.ph}
                                        onChange={(e) => setSoilParams({ ...soilParams, ph: parseFloat(e.target.value) })}
                                        className="slider-input"
                                    />
                                </div>
                                <div className="parameter-scale">
                                    <span>4 (Acidic)</span>
                                    <span>6.5 (Neutral)</span>
                                    <span>9 (Alkaline)</span>
                                </div>
                            </div>

                            <div className="parameter">
                                <div className="parameter-header">
                                    <label>Nitrogen (N)</label>
                                    <div className="parameter-value-group">
                                        <span className="parameter-value">{soilParams.N} kg/ha</span>
                                        <span className="parameter-status" style={{ color: getNutrientStatus(soilParams.N, 'N').color }}>
                                            {getNutrientStatus(soilParams.N, 'N').label}
                                        </span>
                                    </div>
                                </div>
                                <div className="slider-container">
                                    <div className="slider-track">
                                        <div
                                            className="slider-fill"
                                            style={{
                                                width: `${(soilParams.N / 200) * 100}%`,
                                                background: getNutrientStatus(soilParams.N, 'N').color
                                            }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="200"
                                        value={soilParams.N}
                                        onChange={(e) => setSoilParams({ ...soilParams, N: parseInt(e.target.value) })}
                                        className="slider-input"
                                    />
                                </div>
                                <div className="parameter-scale">
                                    <span>0</span>
                                    <span>100</span>
                                    <span>200</span>
                                </div>
                            </div>

                            <div className="parameter">
                                <div className="parameter-header">
                                    <label>Phosphorus (P)</label>
                                    <div className="parameter-value-group">
                                        <span className="parameter-value">{soilParams.P} kg/ha</span>
                                        <span className="parameter-status" style={{ color: getNutrientStatus(soilParams.P, 'P').color }}>
                                            {getNutrientStatus(soilParams.P, 'P').label}
                                        </span>
                                    </div>
                                </div>
                                <div className="slider-container">
                                    <div className="slider-track">
                                        <div
                                            className="slider-fill"
                                            style={{
                                                width: `${(soilParams.P / 100) * 100}%`,
                                                background: getNutrientStatus(soilParams.P, 'P').color
                                            }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={soilParams.P}
                                        onChange={(e) => setSoilParams({ ...soilParams, P: parseInt(e.target.value) })}
                                        className="slider-input"
                                    />
                                </div>
                                <div className="parameter-scale">
                                    <span>0</span>
                                    <span>50</span>
                                    <span>100</span>
                                </div>
                            </div>

                            <div className="parameter">
                                <div className="parameter-header">
                                    <label>Potassium (K)</label>
                                    <div className="parameter-value-group">
                                        <span className="parameter-value">{soilParams.K} kg/ha</span>
                                        <span className="parameter-status" style={{ color: getNutrientStatus(soilParams.K, 'K').color }}>
                                            {getNutrientStatus(soilParams.K, 'K').label}
                                        </span>
                                    </div>
                                </div>
                                <div className="slider-container">
                                    <div className="slider-track">
                                        <div
                                            className="slider-fill"
                                            style={{
                                                width: `${(soilParams.K / 100) * 100}%`,
                                                background: getNutrientStatus(soilParams.K, 'K').color
                                            }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={soilParams.K}
                                        onChange={(e) => setSoilParams({ ...soilParams, K: parseInt(e.target.value) })}
                                        className="slider-input"
                                    />
                                </div>
                                <div className="parameter-scale">
                                    <span>0</span>
                                    <span>50</span>
                                    <span>100</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weather Parameters */}
                <div className="form-section">
                    <div className="section-icon">
                        <Cloud size={20} />
                    </div>
                    <div className="section-content">
                        <h3 className="section-title">Weather Parameters</h3>
                        <p className="section-subtitle">Expected climate conditions</p>

                        <div className="parameters-grid">
                            <div className="parameter">
                                <div className="parameter-header">
                                    <label>🌧️ Annual Rainfall</label>
                                    <div className="parameter-value-group">
                                        <span className="parameter-value">{weatherParams.rainfall} mm</span>
                                        <span className="parameter-status" style={{ color: weatherParams.rainfall < 500 ? '#ef4444' : weatherParams.rainfall > 1500 ? '#f59e0b' : '#22c55e' }}>
                                            {weatherParams.rainfall < 500 ? 'Low' : weatherParams.rainfall > 1500 ? 'High' : 'Moderate'}
                                        </span>
                                    </div>
                                </div>
                                <div className="slider-container">
                                    <div className="slider-track">
                                        <div
                                            className="slider-fill"
                                            style={{
                                                width: `${((weatherParams.rainfall - 200) / 1800) * 100}%`,
                                                background: '#0ea5e9'
                                            }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="200"
                                        max="2000"
                                        step="50"
                                        value={weatherParams.rainfall}
                                        onChange={(e) => setWeatherParams({ ...weatherParams, rainfall: parseInt(e.target.value) })}
                                        className="slider-input"
                                    />
                                </div>
                                <div className="parameter-scale">
                                    <span>200mm</span>
                                    <span>1000mm</span>
                                    <span>2000mm</span>
                                </div>
                            </div>

                            <div className="parameter">
                                <div className="parameter-header">
                                    <label>🌡️ Avg Temperature</label>
                                    <div className="parameter-value-group">
                                        <span className="parameter-value">{weatherParams.temperature}°C</span>
                                        <span className="parameter-status" style={{ color: weatherParams.temperature < 15 ? '#0ea5e9' : weatherParams.temperature > 35 ? '#ef4444' : '#22c55e' }}>
                                            {weatherParams.temperature < 15 ? 'Cool' : weatherParams.temperature > 35 ? 'Hot' : 'Warm'}
                                        </span>
                                    </div>
                                </div>
                                <div className="slider-container">
                                    <div className="slider-track">
                                        <div
                                            className="slider-fill"
                                            style={{
                                                width: `${((weatherParams.temperature - 10) / 35) * 100}%`,
                                                background: weatherParams.temperature < 20 ? '#0ea5e9' : weatherParams.temperature > 30 ? '#ef4444' : '#f59e0b'
                                            }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="45"
                                        value={weatherParams.temperature}
                                        onChange={(e) => setWeatherParams({ ...weatherParams, temperature: parseInt(e.target.value) })}
                                        className="slider-input"
                                    />
                                </div>
                                <div className="parameter-scale">
                                    <span>10°C</span>
                                    <span>25°C</span>
                                    <span>45°C</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Settings */}
                <div className="form-section">
                    <div className="section-icon">
                        <Settings size={20} />
                    </div>
                    <div className="section-content">
                        <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                            <h3 className="section-title">Advanced Settings</h3>
                            <span className="toggle-icon">{showAdvanced ? '−' : '+'}</span>
                        </div>

                        {showAdvanced && (
                            <div className="advanced-content">
                                <label className="checkbox-label">
                                    <input type="checkbox" defaultChecked />
                                    <span>Auto-fill from database</span>
                                </label>
                                <label className="checkbox-label">
                                    <input type="checkbox" />
                                    <span>Use historical data</span>
                                </label>
                                <label className="checkbox-label">
                                    <input type="checkbox" defaultChecked />
                                    <span>Include satellite imagery analysis</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Predict Button */}
                <button
                    className="btn-predict"
                    onClick={handlePredict}
                    disabled={loading || farms.length === 0}
                >
                    {loading ? (
                        <>
                            <Loader2 size={24} className="spinning" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Sparkles size={24} />
                            Predict Best Crop for My Land
                        </>
                    )}
                </button>

                <div className="powered-by">
                    Powered by Smart Agro AI
                </div>
            </div>

            {/* Prediction Progress Modal */}
            {showPredictionModal && (
                <div className="prediction-modal-overlay">
                    <div className="prediction-modal">
                        <div className="modal-header">
                            <Cpu size={28} />
                            <h2>AI Prediction in Progress</h2>
                        </div>

                        <div className="prediction-steps">
                            {PREDICTION_STEPS.map((step, index) => {
                                const status = stepStatuses[step.id];
                                const isActive = currentStep === step.id - 1 || status?.status === 'processing';
                                const isCompleted = status?.status === 'completed';

                                return (
                                    <div
                                        key={step.id}
                                        className={`prediction-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                    >
                                        <div className="step-indicator">
                                            {getStepIcon(step, status)}
                                            {index < PREDICTION_STEPS.length - 1 && (
                                                <div className={`step-line ${isCompleted ? 'completed' : ''}`} />
                                            )}
                                        </div>
                                        <div className="step-content">
                                            <div className="step-header">
                                                <span className="step-name">{step.name}</span>
                                                {status?.duration && (
                                                    <span className="step-duration">{status.duration}</span>
                                                )}
                                            </div>
                                            <p className="step-description">{step.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Results Preview */}
                        {predictionResult && (
                            <div className="prediction-result-preview">
                                <div className="result-header">
                                    <CheckCircle size={24} className="success-icon" />
                                    <h3>Prediction Complete!</h3>
                                </div>

                                <div className="result-summary">
                                    <div className="result-crop">
                                        <span className="crop-emoji">
                                            {predictionResult.crop === 'Rice' ? '🌾' :
                                                predictionResult.crop === 'Wheat' ? '🌾' :
                                                    predictionResult.crop === 'Maize' ? '🌽' : '🌱'}
                                        </span>
                                        <div className="crop-info">
                                            <span className="crop-name">{predictionResult.crop}</span>
                                            <span className="crop-confidence">
                                                {predictionResult.confidence} confidence
                                            </span>
                                        </div>
                                    </div>

                                    <div className="result-weights">
                                        <div className="weight-item">
                                            <span className="weight-label">Image Analysis</span>
                                            <div className="weight-bar">
                                                <div
                                                    className="weight-fill image"
                                                    style={{ width: `${predictionResult.image_weight}%` }}
                                                />
                                            </div>
                                            <span className="weight-value">{predictionResult.image_weight}%</span>
                                        </div>
                                        <div className="weight-item">
                                            <span className="weight-label">Soil & Weather</span>
                                            <div className="weight-bar">
                                                <div
                                                    className="weight-fill tabular"
                                                    style={{ width: `${predictionResult.tabular_weight}%` }}
                                                />
                                            </div>
                                            <span className="weight-value">{predictionResult.tabular_weight}%</span>
                                        </div>
                                    </div>

                                    {predictionResult.yield_estimate && (
                                        <div className="yield-estimate">
                                            <span className="yield-label">Estimated Yield:</span>
                                            <span className="yield-value">
                                                {predictionResult.yield_estimate.estimated_yield_tons} tons
                                            </span>
                                            <span className="yield-area">
                                                ({predictionResult.yield_estimate.area_acres} acres)
                                            </span>
                                        </div>
                                    )}

                                    {predictionResult.top_predictions && predictionResult.top_predictions.length > 1 && (
                                        <div className="alternative-crops">
                                            <span className="alt-label">Alternative options:</span>
                                            <div className="alt-list">
                                                {predictionResult.top_predictions.slice(1).map((pred, idx) => (
                                                    <span key={idx} className="alt-crop">
                                                        {pred.crop} ({(pred.probability * 100).toFixed(1)}%)
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="result-actions">
                                    <button className="btn btn-secondary" onClick={() => setShowPredictionModal(false)}>
                                        Close
                                    </button>
                                    <button className="btn btn-primary" onClick={handleViewResults}>
                                        View Full Results
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {!predictionResult && (
                            <div className="processing-info">
                                <p>Please wait while we analyze your farm data...</p>
                                <div className="processing-time">
                                    Processing time: ~2-5 seconds
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Predictions;
