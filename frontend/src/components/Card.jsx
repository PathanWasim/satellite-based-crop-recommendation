import React from 'react';
import './Card.css';

const Card = ({
    children,
    className = '',
    hover = true,
    onClick,
    icon: Icon,
    title,
    subtitle,
    color = 'green'
}) => {
    return (
        <div
            className={`action-card ${hover ? 'hover-effect' : ''} ${className}`}
            onClick={onClick}
            style={{ '--card-color': `var(--${color}-500)` }}
        >
            {Icon && (
                <div className="card-icon" style={{ background: `var(--${color}-100)`, color: `var(--${color}-600)` }}>
                    <Icon size={24} />
                </div>
            )}
            <div className="card-content">
                {title && <h3 className="card-title">{title}</h3>}
                {subtitle && <p className="card-subtitle">{subtitle}</p>}
                {children}
            </div>
        </div>
    );
};

export default Card;
