import React, { useState, useEffect } from 'react';
import {
    BarChart3, Download, FileText, Filter, Search, Calendar, TrendingUp,
    Leaf, Sun, Droplets, DollarSign, Printer, FileSpreadsheet
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import { useToast } from '../context/ToastContext';
import { getPredictions, formatDate } from '../services/historyService';
import './Reports.css';

// Crop price data (simulated market rates in INR per quintal)
const CROP_PRICES = {
    'Wheat': { price: 2275, trend: '+2.3%', season: 'Rabi' },
    'Rice': { price: 2183, trend: '+1.8%', season: 'Kharif' },
    'Maize': { price: 1962, trend: '-0.5%', season: 'Kharif' },
    'Cotton': { price: 6620, trend: '+3.1%', season: 'Kharif' },
    'Sugarcane': { price: 315, trend: '+1.2%', season: 'Annual' },
    'Soybean': { price: 4600, trend: '+2.8%', season: 'Kharif' },
    'Groundnut': { price: 5850, trend: '+1.5%', season: 'Kharif' },
    'Pulses': { price: 6600, trend: '+4.2%', season: 'Rabi' },
    'Forest': { price: 0, trend: '0%', season: 'Perennial' },
    'PermanentCrop': { price: 3500, trend: '+2.0%', season: 'Perennial' },
    'HerbaceousVegetation': { price: 2000, trend: '+1.0%', season: 'Various' },
    'AnnualCrop': { price: 2500, trend: '+1.5%', season: 'Annual' },
    'Pasture': { price: 1500, trend: '+0.8%', season: 'Perennial' }
};

// Seasonal crop recommendations
const SEASONAL_CROPS = {
    'Winter': ['Wheat', 'Barley', 'Mustard', 'Peas', 'Gram'],
    'Summer': ['Rice', 'Maize', 'Cotton', 'Groundnut', 'Soybean'],
    'Monsoon': ['Rice', 'Maize', 'Sorghum', 'Pearl Millet', 'Cotton'],
    'Autumn': ['Potato', 'Onion', 'Tomato', 'Cabbage', 'Cauliflower']
};

// Yield estimation based on soil/weather (tons per hectare)
const estimateYield = (crop, soilParams, weatherParams) => {
    const baseYields = {
        'Wheat': 3.5, 'Rice': 4.0, 'Maize': 5.5, 'Cotton': 1.8,
        'Sugarcane': 70, 'Soybean': 2.0, 'Groundnut': 1.5, 'Pulses': 1.2,
        'Forest': 0, 'PermanentCrop': 8, 'HerbaceousVegetation': 2, 'AnnualCrop': 3, 'Pasture': 5
    };

    let baseYield = baseYields[crop] || 2.5;
    let modifier = 1.0;

    // pH modifier
    const ph = soilParams?.ph || 6.5;
    if (ph >= 6.0 && ph <= 7.5) modifier *= 1.1;
    else if (ph < 5.5 || ph > 8.0) modifier *= 0.8;

    // Nitrogen modifier
    const N = soilParams?.N || 50;
    if (N >= 40 && N <= 80) modifier *= 1.15;
    else if (N < 20) modifier *= 0.7;

    // Rainfall modifier
    const rainfall = weatherParams?.rainfall || 100;
    if (rainfall >= 80 && rainfall <= 150) modifier *= 1.1;
    else if (rainfall < 50 || rainfall > 200) modifier *= 0.85;

    return (baseYield * modifier).toFixed(2);
};

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Reports = () => {
    const toast = useToast();
    const [predictions, setPredictions] = useState([]);
    const [filteredPredictions, setFilteredPredictions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCrop, setFilterCrop] = useState('all');
    const [filterFarm, setFilterFarm] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [currentSeason, setCurrentSeason] = useState('');

    useEffect(() => {
        const data = getPredictions();
        setPredictions(data);
        setFilteredPredictions(data);

        // Determine current season
        const month = new Date().getMonth();
        if (month >= 10 || month <= 1) setCurrentSeason('Winter');
        else if (month >= 2 && month <= 4) setCurrentSeason('Summer');
        else if (month >= 5 && month <= 8) setCurrentSeason('Monsoon');
        else setCurrentSeason('Autumn');
    }, []);

    useEffect(() => {
        let filtered = [...predictions];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.prediction?.crop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.farmName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Crop filter
        if (filterCrop !== 'all') {
            filtered = filtered.filter(p => p.prediction?.crop === filterCrop);
        }

        // Farm filter
        if (filterFarm !== 'all') {
            filtered = filtered.filter(p => p.farmName === filterFarm);
        }

        // Date range filter
        if (dateRange !== 'all') {
            const now = Date.now();
            const ranges = {
                'week': 7 * 24 * 60 * 60 * 1000,
                'month': 30 * 24 * 60 * 60 * 1000,
                'quarter': 90 * 24 * 60 * 60 * 1000
            };
            filtered = filtered.filter(p => (now - p.timestamp) <= ranges[dateRange]);
        }

        setFilteredPredictions(filtered);
    }, [searchTerm, filterCrop, filterFarm, dateRange, predictions]);

    // Get unique crops and farms for filters
    const uniqueCrops = [...new Set(predictions.map(p => p.prediction?.crop).filter(Boolean))];
    const uniqueFarms = [...new Set(predictions.map(p => p.farmName).filter(Boolean))];

    // Prepare chart data
    const cropDistribution = uniqueCrops.map(crop => ({
        name: crop,
        value: predictions.filter(p => p.prediction?.crop === crop).length
    })).sort((a, b) => b.value - a.value);

    const monthlyTrends = () => {
        const months = {};
        predictions.forEach(p => {
            const month = new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            months[month] = (months[month] || 0) + 1;
        });
        return Object.entries(months).map(([month, count]) => ({ month, predictions: count })).slice(-6);
    };

    const confidenceData = () => {
        const ranges = { '90-100%': 0, '80-89%': 0, '70-79%': 0, '<70%': 0 };
        predictions.forEach(p => {
            const conf = parseFloat(p.prediction?.confidence) || 0;
            if (conf >= 90) ranges['90-100%']++;
            else if (conf >= 80) ranges['80-89%']++;
            else if (conf >= 70) ranges['70-79%']++;
            else ranges['<70%']++;
        });
        return Object.entries(ranges).map(([range, count]) => ({ range, count }));
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Farm', 'Crop', 'Confidence', 'pH', 'Nitrogen', 'Phosphorus', 'Potassium', 'Rainfall', 'Temperature', 'Estimated Yield'];
        const rows = filteredPredictions.map(p => [
            formatDate(p.timestamp),
            p.farmName || 'Unknown',
            p.prediction?.crop || 'Unknown',
            p.prediction?.confidence || 'N/A',
            p.soilParams?.ph || 'N/A',
            p.soilParams?.N || 'N/A',
            p.soilParams?.P || 'N/A',
            p.soilParams?.K || 'N/A',
            p.weatherParams?.rainfall || 'N/A',
            p.weatherParams?.temperature || 'N/A',
            estimateYield(p.prediction?.crop, p.soilParams, p.weatherParams)
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GeoCrop_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('CSV exported successfully!');
    };

    const printReport = () => {
        window.print();
        toast.success('Print dialog opened');
    };

    const generateFullPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(34, 197, 94);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('GeoCrop Analytics Report', 20, 23);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 20, 23, { align: 'right' });

        let y = 50;
        doc.setTextColor(0, 0, 0);

        // Summary Stats
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary Statistics', 20, y);
        y += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Predictions: ${predictions.length}`, 20, y);
        doc.text(`Unique Crops: ${uniqueCrops.length}`, 100, y);
        y += 7;
        doc.text(`Unique Farms: ${uniqueFarms.length}`, 20, y);
        doc.text(`Current Season: ${currentSeason}`, 100, y);
        y += 15;

        // Top Crops
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Recommended Crops', 20, y);
        y += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        cropDistribution.slice(0, 5).forEach((crop, i) => {
            const price = CROP_PRICES[crop.name];
            doc.text(`${i + 1}. ${crop.name}: ${crop.value} predictions | ₹${price?.price || 'N/A'}/quintal`, 20, y);
            y += 7;
        });
        y += 10;

        // Seasonal Recommendations
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Seasonal Recommendations (${currentSeason})`, 20, y);
        y += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(SEASONAL_CROPS[currentSeason]?.join(', ') || 'N/A', 20, y);

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('GeoCrop - Smart Crop Prediction System', pageWidth / 2, 285, { align: 'center' });

        doc.save(`GeoCrop_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('PDF report generated!');
    };


    return (
        <div className="reports-page">
            <div className="reports-header">
                <div className="header-info">
                    <div className="header-icon"><BarChart3 size={32} /></div>
                    <div>
                        <h1>Analytics & Reports</h1>
                        <p>Comprehensive insights from your crop predictions</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={printReport}>
                        <Printer size={18} /> Print
                    </button>
                    <button className="btn btn-secondary" onClick={exportToCSV}>
                        <FileSpreadsheet size={18} /> Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={generateFullPDF}>
                        <Download size={18} /> Download PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search crops or farms..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                    <option value="quarter">Last 90 Days</option>
                </select>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <TrendingUp size={24} className="stat-icon green" />
                    <div className="stat-info">
                        <span className="stat-value">{filteredPredictions.length}</span>
                        <span className="stat-label">Total Predictions</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Leaf size={24} className="stat-icon blue" />
                    <div className="stat-info">
                        <span className="stat-value">{uniqueCrops.length}</span>
                        <span className="stat-label">Crop Types</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Sun size={24} className="stat-icon orange" />
                    <div className="stat-info">
                        <span className="stat-value">{currentSeason}</span>
                        <span className="stat-label">Current Season</span>
                    </div>
                </div>
                <div className="stat-card">
                    <DollarSign size={24} className="stat-icon purple" />
                    <div className="stat-info">
                        <span className="stat-value">₹{cropDistribution[0] ? CROP_PRICES[cropDistribution[0].name]?.price || 0 : 0}</span>
                        <span className="stat-label">Top Crop Price/Q</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                <div className="chart-card">
                    <h3><Leaf size={20} /> Crop Distribution</h3>
                    {cropDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={cropDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {cropDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="no-data">No data available</p>}
                </div>

                <div className="chart-card">
                    <h3><TrendingUp size={20} /> Prediction Trends</h3>
                    {monthlyTrends().length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={monthlyTrends()}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="predictions" stroke="#22c55e" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <p className="no-data">No data available</p>}
                </div>

                <div className="chart-card">
                    <h3><BarChart3 size={20} /> Confidence Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={confidenceData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Seasonal Recommendations */}
            <div className="section-card">
                <h3><Calendar size={20} /> Seasonal Recommendations ({currentSeason})</h3>
                <div className="seasonal-crops">
                    {SEASONAL_CROPS[currentSeason]?.map((crop, i) => (
                        <div key={i} className="seasonal-crop-tag">
                            <span className="crop-emoji">🌱</span>
                            <span>{crop}</span>
                        </div>
                    ))}
                </div>
                <p className="seasonal-tip">
                    💡 Based on current {currentSeason} season, these crops are recommended for optimal yield.
                </p>
            </div>

            {/* Market Prices */}
            <div className="section-card">
                <h3><DollarSign size={20} /> Current Market Prices (MSP)</h3>
                <div className="price-grid">
                    {Object.entries(CROP_PRICES).slice(0, 8).map(([crop, data]) => (
                        <div key={crop} className="price-card">
                            <span className="price-crop">{crop}</span>
                            <span className="price-value">₹{data.price}/Q</span>
                            <span className={`price-trend ${data.trend.startsWith('+') ? 'up' : 'down'}`}>
                                {data.trend}
                            </span>
                            <span className="price-season">{data.season}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Yield Estimations */}
            <div className="section-card">
                <h3><Droplets size={20} /> Yield Estimations</h3>
                {filteredPredictions.length > 0 ? (
                    <div className="yield-table">
                        <div className="yield-header">
                            <span>Farm</span>
                            <span>Crop</span>
                            <span>Est. Yield (t/ha)</span>
                            <span>Market Value</span>
                        </div>
                        {filteredPredictions.slice(0, 5).map((pred, i) => {
                            const yieldEst = estimateYield(pred.prediction?.crop, pred.soilParams, pred.weatherParams);
                            const price = CROP_PRICES[pred.prediction?.crop]?.price || 0;
                            const value = (yieldEst * 10 * price).toFixed(0); // Convert to quintals
                            return (
                                <div key={i} className="yield-row">
                                    <span>{pred.farmName || 'Unknown'}</span>
                                    <span>{pred.prediction?.crop || 'Unknown'}</span>
                                    <span className="yield-value">{yieldEst}</span>
                                    <span className="yield-money">₹{parseInt(value).toLocaleString()}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : <p className="no-data">Make predictions to see yield estimations</p>}
            </div>
        </div>
    );
};

export default Reports;
