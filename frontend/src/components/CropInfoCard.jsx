import React from 'react';
import { Droplets, Thermometer, Sun, Calendar, TrendingUp, Leaf } from 'lucide-react';
import './CropInfoCard.css';

// Comprehensive crop database
const CROP_DATABASE = {
    'Wheat': {
        icon: '🌾',
        name: 'Wheat',
        scientificName: 'Triticum aestivum',
        season: 'Rabi (Winter)',
        duration: '120-150 days',
        waterNeeds: 'Moderate (450-650mm)',
        tempRange: '15-25°C',
        soilType: 'Loamy, Clay Loam',
        phRange: '6.0-7.5',
        yieldPotential: '3-5 tons/ha',
        tips: [
            'Best sown in October-November',
            'Requires 4-6 irrigations',
            'Harvest when grain moisture is 12-14%'
        ],
        color: '#f59e0b'
    },
    'Rice': {
        icon: '🌾',
        name: 'Rice',
        scientificName: 'Oryza sativa',
        season: 'Kharif (Monsoon)',
        duration: '90-150 days',
        waterNeeds: 'High (1200-1400mm)',
        tempRange: '20-35°C',
        soilType: 'Clay, Silty Clay',
        phRange: '5.5-6.5',
        yieldPotential: '4-6 tons/ha',
        tips: [
            'Transplant 20-25 day old seedlings',
            'Maintain 5cm standing water',
            'Apply nitrogen in 3 splits'
        ],
        color: '#22c55e'
    },
    'Maize': {
        icon: '🌽',
        name: 'Maize',
        scientificName: 'Zea mays',
        season: 'Kharif/Rabi',
        duration: '80-110 days',
        waterNeeds: 'Moderate (500-800mm)',
        tempRange: '21-30°C',
        soilType: 'Sandy Loam, Loam',
        phRange: '5.5-7.5',
        yieldPotential: '5-8 tons/ha',
        tips: [
            'Plant when soil temp is above 10°C',
            'Critical irrigation at tasseling',
            'Harvest at 20-25% grain moisture'
        ],
        color: '#eab308'
    },
    'Forest': {
        icon: '🌲',
        name: 'Forest Land',
        scientificName: 'Various species',
        season: 'Perennial',
        duration: 'Long-term',
        waterNeeds: 'Natural rainfall',
        tempRange: 'Variable',
        soilType: 'Various',
        phRange: '4.5-7.0',
        yieldPotential: 'N/A',
        tips: [
            'Consider agroforestry options',
            'Protect natural vegetation',
            'Sustainable harvesting practices'
        ],
        color: '#166534'
    },
    'Pasture': {
        icon: '🌿',
        name: 'Pasture Land',
        scientificName: 'Grass species',
        season: 'Year-round',
        duration: 'Perennial',
        waterNeeds: 'Moderate',
        tempRange: '15-30°C',
        soilType: 'Various',
        phRange: '5.5-7.0',
        yieldPotential: '8-15 tons/ha (dry matter)',
        tips: [
            'Rotational grazing recommended',
            'Maintain grass height 5-10cm',
            'Overseed in autumn'
        ],
        color: '#84cc16'
    }
};

const CropInfoCard = ({ cropName, confidence, compact = false }) => {
    const crop = CROP_DATABASE[cropName] || CROP_DATABASE['Forest'];

    if (compact) {
        return (
            <div className="crop-info-compact" style={{ borderColor: crop.color }}>
                <span className="crop-icon-small">{crop.icon}</span>
                <div className="crop-compact-details">
                    <span className="crop-name-small">{crop.name}</span>
                    <span className="crop-season-small">{crop.season}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="crop-info-card">
            <div className="crop-header" style={{ background: `linear-gradient(135deg, ${crop.color}20, ${crop.color}10)` }}>
                <div className="crop-icon-large">{crop.icon}</div>
                <div className="crop-title">
                    <h3>{crop.name}</h3>
                    <p className="scientific-name">{crop.scientificName}</p>
                </div>
                {confidence && (
                    <div className="confidence-pill" style={{ background: crop.color }}>
                        {confidence}% Match
                    </div>
                )}
            </div>

            <div className="crop-details-grid">
                <div className="crop-detail">
                    <Calendar size={18} />
                    <div>
                        <span className="detail-label">Season</span>
                        <span className="detail-value">{crop.season}</span>
                    </div>
                </div>
                <div className="crop-detail">
                    <Sun size={18} />
                    <div>
                        <span className="detail-label">Duration</span>
                        <span className="detail-value">{crop.duration}</span>
                    </div>
                </div>
                <div className="crop-detail">
                    <Droplets size={18} />
                    <div>
                        <span className="detail-label">Water Needs</span>
                        <span className="detail-value">{crop.waterNeeds}</span>
                    </div>
                </div>
                <div className="crop-detail">
                    <Thermometer size={18} />
                    <div>
                        <span className="detail-label">Temperature</span>
                        <span className="detail-value">{crop.tempRange}</span>
                    </div>
                </div>
                <div className="crop-detail">
                    <Leaf size={18} />
                    <div>
                        <span className="detail-label">Soil Type</span>
                        <span className="detail-value">{crop.soilType}</span>
                    </div>
                </div>
                <div className="crop-detail">
                    <TrendingUp size={18} />
                    <div>
                        <span className="detail-label">Yield Potential</span>
                        <span className="detail-value">{crop.yieldPotential}</span>
                    </div>
                </div>
            </div>

            <div className="crop-tips">
                <h4>💡 Growing Tips</h4>
                <ul>
                    {crop.tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CropInfoCard;
