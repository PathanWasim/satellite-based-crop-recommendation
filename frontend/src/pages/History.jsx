import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, Trash2, ChevronDown, ChevronUp, MapPin, Sprout, Calendar, AlertCircle, Download, Search, Filter, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useToast } from '../context/ToastContext';
import { getPredictions, clearHistory, deletePrediction, formatDate } from '../services/historyService';
import './History.css';

const History = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [predictions, setPredictions] = useState([]);
    const [filteredPredictions, setFilteredPredictions] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCrop, setFilterCrop] = useState('all');
    const [filterFarm, setFilterFarm] = useState('all');
    const [dateRange, setDateRange] = useState('all');

    // Load predictions on mount
    useEffect(() => {
        loadPredictions();
    }, []);

    useEffect(() => {
        let filtered = [...predictions];
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.prediction?.crop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.farmName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterCrop !== 'all') {
            filtered = filtered.filter(p => p.prediction?.crop === filterCrop);
        }
        if (filterFarm !== 'all') {
            filtered = filtered.filter(p => p.farmName === filterFarm);
        }
        if (dateRange !== 'all') {
            const now = Date.now();
            const ranges = { 'week': 7 * 24 * 60 * 60 * 1000, 'month': 30 * 24 * 60 * 60 * 1000 };
            filtered = filtered.filter(p => (now - p.timestamp) <= ranges[dateRange]);
        }
        setFilteredPredictions(filtered);
    }, [searchTerm, filterCrop, filterFarm, dateRange, predictions]);

    const loadPredictions = () => {
        const data = getPredictions();
        setPredictions(data);
        setFilteredPredictions(data);
    };

    const uniqueCrops = [...new Set(predictions.map(p => p.prediction?.crop).filter(Boolean))];
    const uniqueFarms = [...new Set(predictions.map(p => p.farmName).filter(Boolean))];

    const exportToCSV = () => {
        const headers = ['Date', 'Farm', 'Crop', 'Confidence', 'pH', 'N', 'P', 'K', 'Rainfall', 'Temperature'];
        const rows = filteredPredictions.map(p => [
            formatDate(p.timestamp), p.farmName || '', p.prediction?.crop || '',
            p.prediction?.confidence || '', p.soilParams?.ph || '', p.soilParams?.N || '',
            p.soilParams?.P || '', p.soilParams?.K || '', p.weatherParams?.rainfall || '', p.weatherParams?.temperature || ''
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GeoCrop_History_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('CSV exported!');
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

    const handleDownloadPDF = (pred, e) => {
        e.stopPropagation();

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(34, 197, 94);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('GeoCrop', 20, 25);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Crop Prediction Report', pageWidth - 20, 25, { align: 'right' });

        // Reset text color
        doc.setTextColor(0, 0, 0);

        let y = 55;

        // Prediction Result
        doc.setFillColor(240, 253, 244);
        doc.rect(15, y - 5, pageWidth - 30, 30, 'F');

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Recommended Crop', 20, y + 5);

        doc.setFontSize(22);
        doc.setTextColor(34, 197, 94);
        doc.text(pred.prediction?.crop || 'Unknown', 20, y + 20);

        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text(`Confidence: ${pred.prediction?.confidence || 'N/A'}`, pageWidth - 20, y + 15, { align: 'right' });

        y += 45;
        doc.setTextColor(0, 0, 0);

        // Farm Details
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Farm Details', 20, y);
        y += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Farm Name: ${pred.farmName || 'Unknown'}`, 20, y);
        y += 7;
        doc.text(`Location: ${pred.farmCoordinates?.lat?.toFixed(4) || 'N/A'}°N, ${pred.farmCoordinates?.lng?.toFixed(4) || 'N/A'}°E`, 20, y);
        y += 7;
        doc.text(`Date: ${formatDate(pred.timestamp)}`, 20, y);
        y += 15;

        // Soil Parameters
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Soil Parameters', 20, y);
        y += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const soilData = [
            ['pH Level', pred.soilParams?.ph || 'N/A'],
            ['Nitrogen (N)', `${pred.soilParams?.N || 'N/A'} kg/ha`],
            ['Phosphorus (P)', `${pred.soilParams?.P || 'N/A'} kg/ha`],
            ['Potassium (K)', `${pred.soilParams?.K || 'N/A'} kg/ha`]
        ];

        soilData.forEach(([label, value]) => {
            doc.text(`${label}: ${value}`, 20, y);
            y += 7;
        });
        y += 8;

        // Weather Parameters
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Weather Parameters', 20, y);
        y += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Rainfall: ${pred.weatherParams?.rainfall || 'N/A'} mm`, 20, y);
        y += 7;
        doc.text(`Temperature: ${pred.weatherParams?.temperature || 'N/A'}°C`, 20, y);
        y += 15;

        // Model Insights
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('AI Model Insights', 20, y);
        y += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Image Analysis Weight: ${pred.prediction?.w_img || 'N/A'}`, 20, y);
        y += 7;
        doc.text(`Soil Data Weight: ${pred.prediction?.w_tab || 'N/A'}`, 20, y);
        y += 15;

        // Recommendation
        if (pred.prediction?.recommendation) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Recommendation', 20, y);
            y += 10;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            const splitRec = doc.splitTextToSize(pred.prediction.recommendation, pageWidth - 40);
            doc.text(splitRec, 20, y);
        }

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated by GeoCrop - Smart Crop Prediction System', pageWidth / 2, 285, { align: 'center' });

        // Save
        const fileName = `GeoCrop_${pred.prediction?.crop || 'Prediction'}_${new Date(pred.timestamp).toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        toast.success('PDF downloaded successfully!');
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
                    <p className="page-subtitle">{filteredPredictions.length} of {predictions.length} prediction{predictions.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={exportToCSV}>
                        <FileSpreadsheet size={18} /> Export CSV
                    </button>
                    <button className="btn btn-secondary clear-btn" onClick={() => setShowClearConfirm(true)}>
                        <Trash2 size={18} /> Clear All
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="history-filters">
                <div className="search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Search crops or farms..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select value={filterCrop} onChange={(e) => setFilterCrop(e.target.value)}>
                    <option value="all">All Crops</option>
                    {uniqueCrops.map(crop => <option key={crop} value={crop}>{crop}</option>)}
                </select>
                <select value={filterFarm} onChange={(e) => setFilterFarm(e.target.value)}>
                    <option value="all">All Farms</option>
                    {uniqueFarms.map(farm => <option key={farm} value={farm}>{farm}</option>)}
                </select>
                <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                    <option value="all">All Time</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                </select>
            </div>

            <div className="history-list">
                {filteredPredictions.map((pred) => (
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
                                className="download-btn"
                                onClick={(e) => handleDownloadPDF(pred, e)}
                                aria-label="Download PDF"
                                title="Download PDF Report"
                            >
                                <Download size={18} />
                            </button>
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
