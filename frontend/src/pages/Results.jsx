import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Share2, RefreshCw, CheckCircle2, TrendingUp, History, FileText, Cpu } from 'lucide-react';
import { jsPDF } from 'jspdf';
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

// Helper to parse weights correctly
const parseWeight = (value, fallback = 50) => {
    if (value === undefined || value === null) return fallback;

    let num = value;
    if (typeof value === 'string') {
        num = parseFloat(value);
    }

    if (isNaN(num)) return fallback;

    // If value is <= 1, it's a decimal (0.65), multiply by 100
    // If value is > 1, it's already a percentage (65)
    return num <= 1 ? num * 100 : num;
};

const Results = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const { farm, soil, weather, prediction } = location.state || {};

    // Parse gating weights correctly - backend sends image_weight/tabular_weight as percentages
    // or w_img/w_tab as decimals like "0.6500"
    let imageWeight = 65;
    let tabularWeight = 35;

    if (prediction) {
        // image_weight is already a percentage (e.g., 65.00)
        // w_img is a decimal string (e.g., "0.6500")
        if (prediction.image_weight != null) {
            imageWeight = parseWeight(prediction.image_weight, 65);
        } else if (prediction.w_img != null) {
            imageWeight = parseWeight(prediction.w_img, 65);
        }

        if (prediction.tabular_weight != null) {
            tabularWeight = parseWeight(prediction.tabular_weight, 35);
        } else if (prediction.w_tab != null) {
            tabularWeight = parseWeight(prediction.w_tab, 35);
        }
    }

    // Debug log
    console.log('Weights from prediction:', {
        raw_img: prediction?.image_weight,
        raw_tab: prediction?.tabular_weight,
        raw_w_img: prediction?.w_img,
        raw_w_tab: prediction?.w_tab,
        parsed_img: imageWeight,
        parsed_tab: tabularWeight
    });

    // Prediction data
    const predictionData = prediction ? {
        crop: prediction.crop,
        confidence: parseFloat(prediction.confidence?.toString().replace('%', '') || 85),
        icon: getCropIcon(prediction.crop)
    } : {
        crop: 'Wheat',
        confidence: 85,
        icon: '🌾'
    };

    // Generate PDF Report
    const generatePDFReport = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        const addText = (text, x, yPos, options = {}) => {
            doc.setFontSize(options.size || 12);
            doc.setFont('helvetica', options.style || 'normal');
            if (options.color) doc.setTextColor(...options.color);
            else doc.setTextColor(0, 0, 0);
            doc.text(text, x, yPos);
            return yPos + (options.lineHeight || 7);
        };

        // Header
        doc.setFillColor(22, 163, 74);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('GeoCrop Predictor', pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(12);
        doc.text('Crop Recommendation Report', pageWidth / 2, 28, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 36, { align: 'center' });

        y = 55;

        // Prediction Result
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
        doc.text(`Confidence: ${predictionData.confidence}%`, pageWidth / 2, y + 27, { align: 'center' });

        y = 100;

        // Farm & Input Details
        doc.setTextColor(0, 0, 0);
        y = addText('FARM & INPUT DETAILS', 15, y, { size: 14, style: 'bold', color: [22, 163, 74] });
        doc.line(15, y - 3, 100, y - 3);
        y += 3;
        y = addText(`Farm: ${farm?.name || 'N/A'} | Area: ${farm?.area || 'N/A'}`, 15, y);
        y = addText(`Location: ${farm?.coordinates?.lat?.toFixed(4) || 'N/A'}°N, ${farm?.coordinates?.lng?.toFixed(4) || 'N/A'}°E`, 15, y);
        y = addText(`Soil: pH ${soil?.ph || 'N/A'} | N: ${soil?.N || 'N/A'} | P: ${soil?.P || 'N/A'} | K: ${soil?.K || 'N/A'} kg/ha`, 15, y);
        y = addText(`Weather: ${weather?.rainfall || 'N/A'}mm rainfall | ${weather?.temperature || 'N/A'}°C avg temp`, 15, y);

        y += 10;

        // Gating Fusion
        y = addText('AI GATING FUSION ANALYSIS', 15, y, { size: 14, style: 'bold', color: [22, 163, 74] });
        doc.line(15, y - 3, 120, y - 3);
        y += 3;
        y = addText(`Satellite Image Weight: ${imageWeight.toFixed(1)}%`, 15, y);
        y = addText(`Soil & Weather Weight: ${tabularWeight.toFixed(1)}%`, 15, y);
        y += 2;

        // Fusion bar
        doc.setFillColor(14, 165, 233);
        doc.rect(15, y, (pageWidth - 30) * (imageWeight / 100), 8, 'F');
        doc.setFillColor(245, 158, 11);
        doc.rect(15 + (pageWidth - 30) * (imageWeight / 100), y, (pageWidth - 30) * (tabularWeight / 100), 8, 'F');
        y += 15;

        y += 5;

        // Recommendation
        y = addText('RECOMMENDATION', 15, y, { size: 14, style: 'bold', color: [22, 163, 74] });
        doc.line(15, y - 3, 95, y - 3);
        y += 3;
        const recommendation = prediction?.recommendation || 'Consult a local agronomist for specific advice.';
        const splitRec = doc.splitTextToSize(recommendation, pageWidth - 30);
        doc.setFontSize(11);
        doc.text(splitRec, 15, y);

        // Footer
        doc.setFillColor(240, 240, 240);
        doc.rect(0, 277, pageWidth, 20, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.text('Powered by GeoCrop Predictor - AI & Satellite Imagery Analysis', pageWidth / 2, 287, { align: 'center' });

        doc.save(`GeoCrop_${farm?.name?.replace(/\s+/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('PDF Report downloaded!');
    };

    const shareReport = async () => {
        const text = `GeoCrop: ${prediction?.crop} recommended with ${predictionData.confidence}% confidence for ${farm?.name}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'GeoCrop Report', text, url: window.location.href });
            } catch (err) {
                navigator.clipboard.writeText(text);
                toast.success('Copied to clipboard!');
            }
        } else {
            navigator.clipboard.writeText(text);
            toast.success('Copied to clipboard!');
        }
    };

    return (
        <div className="results">
            {/* Main Result Card */}
            <div className="result-hero">
                <div className="crop-icon-large">{predictionData.icon}</div>
                <h1 className="result-title">Recommended: {predictionData.crop}</h1>
                <div className="confidence-badge">
                    <div className="confidence-circle">
                        <svg className="confidence-ring" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                            <circle
                                cx="50" cy="50" r="45" fill="none" stroke="#22c55e" strokeWidth="8"
                                strokeDasharray={`${predictionData.confidence * 2.83} 283`}
                                strokeLinecap="round" transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div className="confidence-value">{predictionData.confidence}%</div>
                    </div>
                    <span className="confidence-label">Confidence</span>
                </div>
            </div>

            {/* Gating Fusion - Main Feature */}
            <div className="gating-fusion-card">
                <div className="fusion-header">
                    <Cpu size={24} />
                    <h2>AI Gating Fusion Analysis</h2>
                </div>
                <p className="fusion-desc">
                    LiteGeoNet dynamically weights satellite imagery vs soil/weather data for optimal predictions.
                </p>

                <div className="fusion-weights">
                    <div className="weight-source">
                        <span className="weight-icon">🛰️</span>
                        <div className="weight-details">
                            <span className="weight-name">Satellite Image</span>
                            <span className="weight-sub">CNN feature extraction</span>
                        </div>
                        <span className="weight-value">{imageWeight.toFixed(1)}%</span>
                    </div>

                    <div className="fusion-bar">
                        <div className="bar-fill image" style={{ width: `${imageWeight}%` }}></div>
                        <div className="bar-fill tabular" style={{ width: `${tabularWeight}%` }}></div>
                    </div>

                    <div className="weight-source">
                        <span className="weight-icon">📊</span>
                        <div className="weight-details">
                            <span className="weight-name">Soil & Weather</span>
                            <span className="weight-sub">pH, N, P, K, rainfall, temp</span>
                        </div>
                        <span className="weight-value">{tabularWeight.toFixed(1)}%</span>
                    </div>
                </div>

                <div className="fusion-insight">
                    💡 {imageWeight > 60
                        ? "Model relied more on satellite imagery - clear visual patterns detected."
                        : tabularWeight > 50
                            ? "Model weighted environmental data more - soil/weather factors are key."
                            : "Model balanced both sources equally for a comprehensive analysis."}
                </div>
            </div>

            {/* Input Summary */}
            <div className="input-summary">
                <div className="summary-card">
                    <h3>🌱 Farm</h3>
                    <p className="summary-main">{farm?.name || 'Unknown'}</p>
                    <p className="summary-sub">{farm?.area || '0 acres'}</p>
                </div>
                <div className="summary-card">
                    <h3>🧪 Soil</h3>
                    <p className="summary-main">pH {soil?.ph || 6.5}</p>
                    <p className="summary-sub">N:{soil?.N} P:{soil?.P} K:{soil?.K}</p>
                </div>
                <div className="summary-card">
                    <h3>🌤️ Weather</h3>
                    <p className="summary-main">{weather?.temperature || 28}°C</p>
                    <p className="summary-sub">{weather?.rainfall || 800}mm rain</p>
                </div>
                <div className="summary-card highlight">
                    <h3>🎯 Result</h3>
                    <p className="summary-main">{predictionData.crop}</p>
                    <p className="summary-sub">{predictionData.confidence}% match</p>
                </div>
            </div>

            {/* Recommendation */}
            {prediction?.recommendation && (
                <div className="recommendation-card">
                    <h3><CheckCircle2 size={20} /> Recommendation</h3>
                    <p>{prediction.recommendation}</p>
                </div>
            )}

            {/* Alternative Crops */}
            {prediction?.top_predictions && prediction.top_predictions.length > 1 && (
                <div className="alternatives-card">
                    <h3><TrendingUp size={20} /> Alternative Options</h3>
                    <div className="alternatives-list">
                        {prediction.top_predictions.map((pred, idx) => (
                            <div key={idx} className={`alt-item ${idx === 0 ? 'primary' : ''}`}>
                                <span className="alt-icon">{getCropIcon(pred.crop)}</span>
                                <span className="alt-name">{pred.crop}</span>
                                <span className="alt-prob">{(pred.probability * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Yield Estimate */}
            {prediction?.yield_estimate && (
                <div className="yield-card">
                    <h3>📈 Estimated Yield</h3>
                    <div className="yield-main">
                        <span className="yield-value">{prediction.yield_estimate.estimated_yield_tons}</span>
                        <span className="yield-unit">tons</span>
                    </div>
                    <p className="yield-sub">
                        Based on {prediction.yield_estimate.area_acres} acres
                        @ {prediction.yield_estimate.yield_per_acre} tons/acre
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
                <button className="btn btn-primary" onClick={generatePDFReport}>
                    <FileText size={20} /> Download Report
                </button>
                <button className="btn btn-secondary" onClick={shareReport}>
                    <Share2 size={20} /> Share
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/predictions')}>
                    <RefreshCw size={20} /> New Prediction
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/history')}>
                    <History size={20} /> History
                </button>
            </div>
        </div>
    );
};

export default Results;
