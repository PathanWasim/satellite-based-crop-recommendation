import React from 'react';
import { useToast, TOAST_TYPES } from '../context/ToastContext';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import './ToastContainer.css';

/**
 * Get icon component based on toast type
 */
const getIcon = (type) => {
    switch (type) {
        case TOAST_TYPES.SUCCESS:
            return <CheckCircle size={20} />;
        case TOAST_TYPES.ERROR:
            return <AlertCircle size={20} />;
        case TOAST_TYPES.WARNING:
            return <AlertTriangle size={20} />;
        case TOAST_TYPES.INFO:
        default:
            return <Info size={20} />;
    }
};

/**
 * Single Toast component
 */
const Toast = ({ toast, onClose }) => {
    return (
        <div className={`toast toast-${toast.type}`} role="alert">
            <div className="toast-icon">
                {getIcon(toast.type)}
            </div>
            <div className="toast-content">
                <p className="toast-message">{toast.message}</p>
            </div>
            <button
                className="toast-close"
                onClick={() => onClose(toast.id)}
                aria-label="Close notification"
            >
                <X size={16} />
            </button>
        </div>
    );
};

/**
 * Toast Container component
 * Renders all active toast notifications in a stacked layout
 */
const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="toast-container" aria-live="polite" aria-atomic="true">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    toast={toast}
                    onClose={removeToast}
                />
            ))}
        </div>
    );
};

export default ToastContainer;
