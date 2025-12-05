import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, Trash2, ChevronDown, ChevronUp, MapPin, Sprout, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getPredictions, clearHistory, deletePrediction, formatDate } from '../services/historyService';
import './History.css';

const History = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [predictions, setPredictions] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Load predictions on mount
    useEffect(() => {
        loadPredictions();
    }, []);

    const loadPredictions = () => {
        const data = getPredictions();
        setPredictions(data);
    };

    const handleToggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        deletePrediction(id);
        loadPredictions();
        toast.success('Prediction removed from history');
    };

    const handleClearAll = () => {
        clearHistory();
        loadPredictions();
        setShowClearConfirm(false);
        toast.success('All prediction history cleared');
    };

    const getCropIcon = (crop) => {
        switch (crop?.toLowerCase()) {
            case 'wheat': return '🌾';
            case 'rice': return '🌾';
            case 'maize': return '🌽';
            default: return '🌱';
        }
    };

    if (predictions.length === 0) {
        return (
            <div className="history">
                <div className="history-header">
                    <div className="header-icon">
                        <HistoryIcon size={32} />
                    </div>
                    <div>
                        <h1 className="page-title">Prediction History</h1>
                        <p className="page-subtitle">View your past crop predictions</p>
                    </div>
                </div>

                <div className="empty-state">
                    <div className="empty-icon">
                        <AlertCircle size={64} />
                    </div>
                    <h2>No Predictions Yet</h2>
                    <p>Your prediction history will appear here after you make your first crop prediction.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/predictions')}>
                        <Sprout size={20} />
                        Make a Prediction
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="history">
            <div className="history-header">
                <div className="header-icon">
                    <HistoryIcon size={32} />
                </div>
                <div>
                    <h1 className="page-title">Prediction History</h1>
                    <p className="page-subtitle">{predictions.length} prediction{predictions.length !== 1 ? 's' : ''} recorded</p>
                </div>
                <button
                    className="btn btn-secondary clear-btn"
                    onClick={() => setShowClearConfirm(true)}
                >
                    <Trash2 size={18} />
                    Clear All
                </button>
            </div>

            <div className="history-list">
                {predictions.map((pred) => (
                    <div
                        key={pred.id}
                        className={`history-card ${expandedId === pred.id ? 'expanded' : ''}`}
                        onClick={() => handleToggleExpand(pred.id)}
                    >
                        <div className="history-card-header">
                            <div className="crop-badge">
                                <span className="crop-icon">{getCropIcon(pred.prediction?.crop)}</span>
                                <span className="crop-name">{pred.prediction?.crop || 'Unknown'}</span>
                            </div>
                            <div className="confidence-badge">
                                {pred.prediction?.confidence || 'N/A'}
                            </div>
                        </div>

                        <div className="history-card-info">
                            <div className="info-item">
                                <MapPin size={16} />
                                <span>{pred.farmName || 'Unknown Farm'}</span>
                            </div>
                            <div className="info-item">
                                <Calendar size={16} />
                                <span>{formatDate(pred.timestamp)}</span>
                            </div>
                        </div>

                        <div className="history-card-actions">
                            <button
                                className="expand-btn"
                                aria-label={expandedId === pred.id ? 'Collapse' : 'Expand'}
                            >
                                {expandedId === pred.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                            <button
                                className="delete-btn"
                                onClick={(e) => handleDelete(pred.id, e)}
                                aria-label="Delete prediction"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {expandedId === pred.id && (
                            <div className="history-card-details">
                                <div className="details-section">
                                    <h4>Soil Parameters</h4>
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">pH</span>
                                            <span className="detail-value">{pred.soilParams?.ph || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Nitrogen</span>
                                            <span className="detail-value">{pred.soilParams?.N || 'N/A'} kg/ha</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Phosphorus</span>
                                            <span className="detail-value">{pred.soilParams?.P || 'N/A'} kg/ha</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Potassium</span>
                                            <span className="detail-value">{pred.soilParams?.K || 'N/A'} kg/ha</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="details-section">
                                    <h4>Weather Parameters</h4>
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Rainfall</span>
                                            <span className="detail-value">{pred.weatherParams?.rainfall || 'N/A'} mm</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Temperature</span>
                                            <span className="detail-value">{pred.weatherParams?.temperature || 'N/A'}°C</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="details-section">
                                    <h4>Model Insights</h4>
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Image Weight</span>
                                            <span className="detail-value">{pred.prediction?.w_img || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Data Weight</span>
                                            <span className="detail-value">{pred.prediction?.w_tab || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {pred.prediction?.recommendation && (
                                    <div className="details-section">
                                        <h4>Recommendation</h4>
                                        <p className="recommendation-text">{pred.prediction.recommendation}</p>
                                    </div>
                                )}

                                <div className="details-section coordinates">
                                    <span className="coords-label">Coordinates:</span>
                                    <span className="coords-value">
                                        {pred.farmCoordinates?.lat?.toFixed(4)}°N, {pred.farmCoordinates?.lng?.toFixed(4)}°E
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Clear Confirmation Dialog */}
            {showClearConfirm && (
                <div className="dialog-overlay" onClick={() => setShowClearConfirm(false)}>
                    <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="dialog-title">Clear All History?</h3>
                        <p className="dialog-message">
                            This will permanently delete all {predictions.length} prediction records. This action cannot be undone.
                        </p>
                        <div className="dialog-actions">
                            <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleClearAll}>
                                <Trash2 size={18} />
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
