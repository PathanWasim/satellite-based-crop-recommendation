/**
 * History Service for managing prediction history in localStorage
 */

const STORAGE_KEY = 'predictionHistory';
const MAX_ENTRIES = 50;
const STORAGE_VERSION = 1;

/**
 * Generate a unique ID for predictions
 */
const generateId = () => {
    return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get the storage structure, initializing if needed
 */
const getStorage = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return { version: STORAGE_VERSION, predictions: [] };
        }

        const parsed = JSON.parse(stored);

        // Handle version migration if needed
        if (!parsed.version || parsed.version < STORAGE_VERSION) {
            // Migrate old format
            return { version: STORAGE_VERSION, predictions: parsed.predictions || [] };
        }

        return parsed;
    } catch (error) {
        console.error('Error reading prediction history:', error);
        return { version: STORAGE_VERSION, predictions: [] };
    }
};

/**
 * Save storage structure to localStorage
 */
const saveStorage = (storage) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
        console.error('Error saving prediction history:', error);
        // If storage is full, try pruning
        if (error.name === 'QuotaExceededError') {
            pruneOldEntries(MAX_ENTRIES / 2);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
        }
    }
};

/**
 * Save a new prediction to history
 * @param {Object} prediction - Prediction data to save
 * @returns {Object} The saved prediction with ID and timestamp
 */
export const savePrediction = (prediction) => {
    const storage = getStorage();

    const record = {
        id: generateId(),
        timestamp: Date.now(),
        ...prediction
    };

    // Add to beginning of array (newest first)
    storage.predictions.unshift(record);

    // Prune if over limit
    if (storage.predictions.length > MAX_ENTRIES) {
        storage.predictions = storage.predictions.slice(0, MAX_ENTRIES);
    }

    saveStorage(storage);

    return record;
};

/**
 * Get all predictions from history
 * @returns {Array} Array of prediction records sorted by date (newest first)
 */
export const getPredictions = () => {
    const storage = getStorage();
    // Ensure sorted by timestamp descending
    return storage.predictions.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Get a single prediction by ID
 * @param {string} id - Prediction ID
 * @returns {Object|null} Prediction record or null if not found
 */
export const getPredictionById = (id) => {
    const storage = getStorage();
    return storage.predictions.find(p => p.id === id) || null;
};

/**
 * Delete a prediction by ID
 * @param {string} id - Prediction ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
export const deletePrediction = (id) => {
    const storage = getStorage();
    const initialLength = storage.predictions.length;
    storage.predictions = storage.predictions.filter(p => p.id !== id);

    if (storage.predictions.length < initialLength) {
        saveStorage(storage);
        return true;
    }
    return false;
};

/**
 * Clear all prediction history
 */
export const clearHistory = () => {
    saveStorage({ version: STORAGE_VERSION, predictions: [] });
};

/**
 * Prune old entries to maintain storage limit
 * @param {number} maxEntries - Maximum entries to keep
 */
export const pruneOldEntries = (maxEntries = MAX_ENTRIES) => {
    const storage = getStorage();

    if (storage.predictions.length > maxEntries) {
        // Sort by timestamp and keep only the newest
        storage.predictions = storage.predictions
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, maxEntries);

        saveStorage(storage);
    }
};

/**
 * Get the count of predictions in history
 * @returns {number} Number of predictions
 */
export const getHistoryCount = () => {
    const storage = getStorage();
    return storage.predictions.length;
};

/**
 * Format a timestamp for display
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default {
    savePrediction,
    getPredictions,
    getPredictionById,
    deletePrediction,
    clearHistory,
    pruneOldEntries,
    getHistoryCount,
    formatDate
};
