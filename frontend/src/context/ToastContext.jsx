import React, { createContext, useContext, useState, useCallback } from 'react';

// Toast types
export const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Create context
const ToastContext = createContext(null);

// Generate unique ID
const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Toast Provider component
 * Manages toast notifications state and provides methods to add/remove toasts
 */
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    /**
     * Add a new toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Auto-dismiss duration in ms (default: 5000)
     */
    const addToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 5000) => {
        const id = generateId();
        const toast = {
            id,
            message,
            type,
            timestamp: Date.now()
        };

        setToasts(prev => [toast, ...prev]);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    /**
     * Remove a toast by ID
     * @param {string} id - Toast ID to remove
     */
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    /**
     * Clear all toasts
     */
    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    // Convenience methods for different toast types
    const success = useCallback((message, duration) =>
        addToast(message, TOAST_TYPES.SUCCESS, duration), [addToast]);

    const error = useCallback((message, duration) =>
        addToast(message, TOAST_TYPES.ERROR, duration), [addToast]);

    const warning = useCallback((message, duration) =>
        addToast(message, TOAST_TYPES.WARNING, duration), [addToast]);

    const info = useCallback((message, duration) =>
        addToast(message, TOAST_TYPES.INFO, duration), [addToast]);

    const value = {
        toasts,
        addToast,
        removeToast,
        clearAllToasts,
        success,
        error,
        warning,
        info
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};

/**
 * Custom hook to use toast notifications
 * @returns Toast context with methods to manage toasts
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastContext;
