import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import './SoilHealthScore.css';

const SoilHealthScore = ({ soilParams }) => {
    const { ph, N, P, K } = soilParams;

    // Calculate individual scores
    const getPhScore = (ph) => {
        if (ph >= 6.0 && ph <= 7.0) return 100;
        if (ph >= 5.5 && ph <= 7.5) return 75;
        if (ph >= 5.0 && ph <= 8.0) return 50;
        return 25;
    };

    const getNutrientScore = (value, optimal, max) => {
        const ratio = value / optimal;
        if (ratio >= 0.8 && ratio <= 1.2) return 100;
        if (ratio >= 0.5 && ratio <= 1.5) return 75;
        if (ratio >= 0.3 && ratio <= 2.0) return 50;
        return 25;
    };

    const phScore = getPhScore(ph);
    const nScore = getNutrientScore(N, 60, 200);
    const pScore = getNutrientScore(P, 40, 100);
    const kScore = getNutrientScore(K, 40, 100);

    // Overall score (weighted average)
    const overallScore = Math.round((phScore * 0.3 + nScore * 0.25 + pScore * 0.225 + kScore * 0.225));

    const getScoreColor = (score) => {
        if (score >= 80) return '#22c55e';
        if (score >= 60) return '#84cc16';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Poor';
    };

    const getScoreIcon = (score) => {
        if (score >= 80) return <CheckCircle size={16} />;
        if (score >= 60) return <CheckCircle size={16} />;
        if (score >= 40) return <AlertTriangle size={16} />;
        return <XCircle size={16} />;
    };

    const getRecommendation = () => {
        const issues = [];
        if (phScore < 75) issues.push(ph < 6 ? 'Add lime to increase pH' : 'Add sulfur to decrease pH');
        if (nScore < 75) issues.push(N < 40 ? 'Apply nitrogen fertilizer' : 'Reduce nitrogen application');
        if (pScore < 75) issues.push(P < 30 ? 'Apply phosphorus fertilizer' : 'Reduce phosphorus');
        if (kScore < 75) issues.push(K < 30 ? 'Apply potassium fertilizer' : 'Reduce potassium');

        if (issues.length === 0) return 'Your soil is in excellent condition for most crops!';
        return issues.join('. ') + '.';
    };

    const parameters = [
        { name: 'pH Level', value: ph, unit: '', score: phScore, optimal: '6.0-7.0' },
        { name: 'Nitrogen (N)', value: N, unit: 'kg/ha', score: nScore, optimal: '50-70' },
        { name: 'Phosphorus (P)', value: P, unit: 'kg/ha', score: pScore, optimal: '35-45' },
        { name: 'Potassium (K)', value: K, unit: 'kg/ha', score: kScore, optimal: '35-45' }
    ];

    return (
        <div className="soil-health-card">
            <div className="soil-health-header">
                <h3>🌱 Soil Health Score</h3>
                <div className="overall-score" style={{ borderColor: getScoreColor(overallScore) }}>
                    <div className="score-circle" style={{ background: `conic-gradient(${getScoreColor(overallScore)} ${overallScore * 3.6}deg, #e5e7eb 0deg)` }}>
                        <div className="score-inner">
                            <span className="score-value">{overallScore}</span>
                            <span className="score-label">{getScoreLabel(overallScore)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="parameters-breakdown">
                {parameters.map((param, index) => (
                    <div key={index} className="param-row">
                        <div className="param-info">
                            <span className="param-name">{param.name}</span>
                            <span className="param-value">
                                {param.value}{param.unit && ` ${param.unit}`}
                            </span>
                        </div>
                        <div className="param-bar-container">
                            <div
                                className="param-bar"
                                style={{
                                    width: `${param.score}%`,
                                    background: getScoreColor(param.score)
                                }}
                            />
                        </div>
                        <div className="param-status" style={{ color: getScoreColor(param.score) }}>
                            {getScoreIcon(param.score)}
                            <span>{param.score}%</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="soil-recommendation">
                <Info size={18} />
                <p>{getRecommendation()}</p>
            </div>
        </div>
    );
};

export default SoilHealthScore;
