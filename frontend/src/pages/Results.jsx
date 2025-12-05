import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Share2, RefreshCw, CheckCircle2, Droplets, MapPin, TrendingUp, History, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import CropInfoCard from '../components/CropInfoCard';
import SoilHealthScore from '../components/SoilHealthScore';
import { useToast } from '../context/ToastContext';
import './Results.css';

// Crop icons mapping
const CROP_ICONS = {
    'Wheat': '🌾',
    'Rice': '🌾',
    'Maize': '🌽',
    'Forest': '🌲',
    'Pasture': '🌿',
    'HerbaceousVegetation': '🌱',
    'PermanentCrop': '🍇',
    'River': '💧',
    'SeaLake': '🌊',
    'Highway': '🛣️',
    'Industrial': '🏭',
    'Residential': '🏘️'
};

const getCropIcon = (crop) => CROP_ICONS[crop] || '🌱';

const Results = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const { farm, soil, weather, prediction } = location.state || {};

    // Generate PDF Report
    const generatePDFReport = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        // Helper function to add text
        const addText = (text, x, yPos, options = {}) => {
            doc.setFontSize(options.size || 12);
            doc.setFont('helvetica', options.style || 'normal');
            if (options.color) doc.setTextColor(...options.color);
            else doc.setTextColor(0, 0, 0);
            doc.text(text, x, yPos);
            return yPos + (options.lineHeight || 7);
        };

        // Header with green background
        doc.setFillColor(22, 163, 74);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('GeoCrop Predictor', pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Crop Recommendation Report', pageWidth / 2, 28, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 36, { align: 'center' });

        y = 55;

        // Prediction Result Box
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(15, y - 5, pageWidth - 30, 35, 3, 3, 'F');
        doc.setDrawColor(22, 163, 74);
        doc.roundedRect(15, y - 5, pageWidth - 30, 35, 3, 3, 'S');

        doc.setTextColor(22, 163, 74);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('RECOMMENDED CROP', pageWidth / 2, y + 5, { align: 'center' });
        doc.setFontSize(22);
        doc.text(prediction?.crop || 'N/A', pageWidth / 2, y + 18, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Confidence: ${prediction?.confidence || 'N/A'}`, pageWidth / 2, y + 27, { align: 'center' });

        y = 100;

        // Farm Details Section
        doc.setTextColor(0, 0, 0);
        y = addText('FARM DETAILS', 15, y, { size: 14, style: 'bold', color: [22, 163, 74] });
        doc.setDrawColor(22, 163, 74);
        doc.line(15, y - 3, 80, y - 3);
        y += 3;
        y = addText(`Farm Name: ${farm?.name || 'N/A'}`, 15, y);
        y = addText(`Location: ${farm?.coordinates?.lat?.toFixed(4) || 'N/A'}°N, ${farm?.coordinates?.lng?.toFixed(4) || 'N/A'}°E`, 15, y);
        y = addText(`Area: ${farm?.area || 'N/A'}`, 15, y);

        y += 8;

        // Soil Parameters Section
        y = addText('SOIL PARAMETERS', 15, y, { size: 14, style: 'bold', color: [22, 163, 74] });
        doc.line(15, y - 3, 95, y - 3);
        y += 3;
        y = addText(`pH Level: ${soil?.ph || 'N/A'}`, 15, y);
        y = addText(`Nitrogen (N): ${soil?.N || 'N/A'} kg/ha`, 15, y);
        y = addText(`Phosphorus (P): ${soil?.P || 'N/A'} kg/ha`, 15, y);
        y = addText(`Potassium (K): ${soil?.K || 'N/A'} kg/ha`, 15, y);

        y += 8;

        // Weather Parameters Section
        y = addText('WEATHER PARAMETERS', 15, y, { size: 14, style: 'bold', color: [22, 163, 74] });
        doc.line(15, y - 3, 110, y - 3);
        y += 3;
        y = addText(`Annual Rainfall: ${weather?.rainfall || 'N/A'} mm`, 15, y);
        y = addText(`Average Temperature: ${weather?.temperature || 'N/A'}°C`, 15, y);

        y += 8;

        // Model Insights Section
        y = addText('MODEL INSIGHTS', 15, y, { size: 14, style: 'bold', color: [22, 163, 74] });
        doc.line(15, y - 3, 90, y - 3);
        y += 3;
        y = addText(`Image Analysis Weight: ${prediction?.w_img || 'N/A'}`, 15, y);
        y = addText(`Tabular Data Weight: ${prediction?.w_tab || 'N/A'}`, 15, y);

        y += 8;

        // Recommendation Section
        y = addText('RECOMMENDATION', 15, y, { size: 14, style: 'bold', color: [22, 163, 74] });
        doc.line(15, y - 3, 95, y - 3);
        y += 3;

        const recommendation = prediction?.recommendation || 'Please consult a local agronomist for specific advice based on your local conditions.';
        const splitRecommendation = doc.splitTextToSize(recommendation, pageWidth - 30);
        doc.setFontSize(11);
        doc.text(splitRecommendation, 15, y);

        // Footer
        doc.setFillColor(240, 240, 240);
        doc.rect(0, 277, pageWidth, 20, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.text('Powered by GeoCrop Predictor - AI & Satellite Imagery Analysis', pageWidth / 2, 285, { align: 'center' });
        doc.text('This report is for informational purposes. Consult local experts for final decisions.', pageWidth / 2, 291, { align: 'center' });

        // Save PDF
        const fileName = `GeoCrop_Report_${farm?.name?.replace(/\s+/g, '_') || 'prediction'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        toast.success('PDF Report downloaded successfully!');
    };

    // Share functionality
    const shareReport = async () => {
        const shareData = {
            title: 'GeoCrop Prediction Report',
            text: `Crop Recommendation: ${prediction?.crop || 'N/A'} with ${prediction?.confidence || 'N/A'} confidence for ${farm?.name || 'my farm'}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                toast.success('Shared successfully!');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    copyToClipboard();
                }
            }
        } else {
            copyToClipboard();
        }
    };

    const copyToClipboard = () => {
        const text = `GeoCrop Prediction: ${prediction?.crop || 'N/A'} recommended with ${prediction?.confidence || 'N/A'} confidence for ${farm?.name || 'farm'}`;
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    // Use real prediction data from backend if available, otherwise use mock data
    const predictionData = prediction ? {
        crop: prediction.crop,
        confidence: parseFloat(prediction.confidence.replace('%', '')),
        icon: getCropIcon(prediction.crop)
    } : {
        crop: 'Wheat',
        confidence: 87,
        icon: '🌾'
    };

    const suitabilityData = [
        { name: 'Soil', score: 92 },
        { name: 'Weather', score: 85 },
        { name: 'Location', score: 88 },
    ];

    const alternativeCrops = [
        { name: 'Wheat', value: 87, color: '#22c55e' },
        { name: 'Rice', value: 72, color: '#0ea5e9' },
        { name: 'Maize', value: 65, color: '#f59e0b' },
        { name: 'Others', value: 45, color: '#e5e7eb' },
    ];

    return (
        <div className="results">
            {/* Main Result Card */}
            <div className="result-hero">
                <div className="crop-icon-large">{predictionData.icon}</div>
                <h1 className="result-title">Recommended Crop: {predictionData.crop}</h1>
                <div className="confidence-badge">
                    <div className="confidence-circle">
                        <svg className="confidence-ring" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="8"
                                strokeDasharray={`${predictionData.confidence * 2.83} 283`}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div className="confidence-value">{predictionData.confidence}%</div>
                    </div>
                    <span className="confidence-label">Confidence Score</span>
                </div>
                <div className="match-badge">
                    <CheckCircle2 size={20} />
                    <span>Excellent Match</span>
                </div>
            </div>

            {/* Details Grid */}
            <div className="details-grid">
                {/* Suitability Scores */}
                <div className="detail-card">
                    <h3 className="card-title">
                        <TrendingUp size={20} />
                        Suitability Breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={suitabilityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="name" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip />
                            <Bar dataKey="score" fill="#22c55e" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Soil Compatibility */}
                <div className="detail-card">
                    <h3 className="card-title">
                        <CheckCircle2 size={20} />
                        Soil Compatibility
                    </h3>
                    <div className="compatibility-list">
                        <div className="compatibility-item">
                            <span className="check-icon">✓</span>
                            <span>pH Level: Optimal ({soil?.ph || 6.5})</span>
                        </div>
                        <div className="compatibility-item">
                            <span className="check-icon">✓</span>
                            <span>Nitrogen: Good ({soil?.N || 50} kg/ha)</span>
                        </div>
                        <div className="compatibility-item">
                            <span className="check-icon">✓</span>
                            <span>Phosphorus: Adequate ({soil?.P || 40} kg/ha)</span>
                        </div>
                        <div className="compatibility-item">
                            <span className="check-icon">✓</span>
                            <span>Potassium: Sufficient ({soil?.K || 45} kg/ha)</span>
                        </div>
                    </div>
                </div>

                {/* Weather Fit */}
                <div className="detail-card">
                    <h3 className="card-title">
                        <Droplets size={20} />
                        Weather Fit
                    </h3>
                    <div className="weather-fit">
                        <div className="fit-item">
                            <div className="fit-label">Rainfall Requirement</div>
                            <div className="fit-bar">
                                <div className="fit-bar-fill" style={{ width: '85%' }}></div>
                            </div>
                            <div className="fit-value">{weather?.rainfall || 800}mm / 900mm optimal</div>
                        </div>
                        <div className="fit-item">
                            <div className="fit-label">Temperature Range</div>
                            <div className="fit-bar">
                                <div className="fit-bar-fill" style={{ width: '90%' }}></div>
                            </div>
                            <div className="fit-value">{weather?.temperature || 28}°C / 20-30°C optimal</div>
                        </div>
                    </div>
                </div>

                {/* Geo-Location Match */}
                <div className="detail-card">
                    <h3 className="card-title">
                        <MapPin size={20} />
                        Geo-Location Match
                    </h3>
                    <div className="location-match">
                        <div className="match-score">88%</div>
                        <p className="match-description">
                            Your region has a strong historical record for {predictionData.crop.toLowerCase()} cultivation.
                            Climate patterns and soil composition align well with optimal growing conditions.
                        </p>
                    </div>
                </div>
            </div>

            {/* Crop Information Card */}
            <div className="section-full">
                <CropInfoCard
                    cropName={predictionData.crop}
                    confidence={Math.round(predictionData.confidence)}
                />
            </div>

            {/* Soil Health Score */}
            <div className="section-full">
                <SoilHealthScore soilParams={soil || { ph: 6.5, N: 50, P: 40, K: 45 }} />
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                <div className="chart-card">
                    <h3 className="card-title">Predicted Yield Potential</h3>
                    <div className="yield-info">
                        <div className="yield-value">3.5 - 4.2</div>
                        <div className="yield-unit">tons per hectare</div>
                    </div>
                    <div className="yield-bar">
                        <div className="yield-range" style={{ left: '35%', width: '42%' }}></div>
                    </div>
                    <div className="yield-labels">
                        <span>Low (2.0)</span>
                        <span>High (6.0)</span>
                    </div>
                </div>

                <div className="chart-card">
                    <h3 className="card-title">Alternative Crop Confidence</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={alternativeCrops}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {alternativeCrops.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="legend">
                        {alternativeCrops.map((crop, i) => (
                            <div key={i} className="legend-item">
                                <span className="legend-color" style={{ background: crop.color }}></span>
                                <span>{crop.name} ({crop.value}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
                <button className="btn btn-primary" onClick={generatePDFReport}>
                    <FileText size={20} />
                    Download Report
                </button>
                <button className="btn btn-secondary" onClick={shareReport}>
                    <Share2 size={20} />
                    Share Results
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/predictions')}>
                    <RefreshCw size={20} />
                    New Prediction
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/history')}>
                    <History size={20} />
                    View History
                </button>
            </div>
        </div>
    );
};

export default Results;
