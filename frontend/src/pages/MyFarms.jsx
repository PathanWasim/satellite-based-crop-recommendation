import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, useMap } from 'react-leaflet';
import { Plus, MapPin, Trash2, Edit, Layers, Square, Map, Satellite, Mountain, Check, X, Ruler } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import 'leaflet/dist/leaflet.css';
import './MyFarms.css';

// Fix for default marker icon
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map layer configurations
const MAP_LAYERS = {
    normal: {
        name: 'Normal',
        icon: Map,
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors'
    },
    satellite: {
        name: 'Satellite',
        icon: Satellite,
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri'
    },
    terrain: {
        name: 'Terrain',
        icon: Mountain,
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenTopoMap'
    }
};

// Calculate area of polygon in acres using Shoelace formula
const calculatePolygonArea = (coordinates) => {
    if (!coordinates || coordinates.length < 3) return 0;

    // Convert to radians and calculate area using spherical excess formula
    const toRad = (deg) => deg * Math.PI / 180;
    const R = 6371000; // Earth's radius in meters

    let area = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const lat1 = toRad(coordinates[i][0]);
        const lat2 = toRad(coordinates[j][0]);
        const lng1 = toRad(coordinates[i][1]);
        const lng2 = toRad(coordinates[j][1]);

        area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs(area * R * R / 2);

    // Convert square meters to acres (1 acre = 4046.86 sq meters)
    const acres = area / 4046.86;
    return acres;
};

// Format area display
const formatArea = (acres) => {
    if (acres < 0.1) return `${(acres * 43560).toFixed(0)} sq ft`;
    if (acres < 1) return `${acres.toFixed(2)} acres`;
    return `${acres.toFixed(1)} acres`;
};

// Map click handler component
const MapClickHandler = ({ onMapClick, isDrawing }) => {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng, isDrawing);
        },
    });
    return null;
};

// Component to change map view
const ChangeMapView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom || map.getZoom());
        }
    }, [center, zoom, map]);
    return null;
};

const MyFarms = () => {
    const toast = useToast();

    // Load farms from localStorage
    const [farms, setFarms] = useState(() => {
        const saved = localStorage.getItem('myFarms');
        if (saved) {
            return JSON.parse(saved);
        }
        return [
            {
                id: 1,
                name: 'North Field',
                area: '12.5 acres',
                areaValue: 12.5,
                soilType: 'Loamy',
                coordinates: { lat: 28.6139, lng: 77.2090 },
                boundary: null
            }
        ];
    });

    // Save farms to localStorage
    useEffect(() => {
        localStorage.setItem('myFarms', JSON.stringify(farms));
    }, [farms]);

    const [selectedFarm, setSelectedFarm] = useState(null);
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
    const [mapZoom, setMapZoom] = useState(6);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [satellitePreview, setSatellitePreview] = useState(null);
    const [showAddFarmDialog, setShowAddFarmDialog] = useState(false);
    const [newFarmName, setNewFarmName] = useState('');
    const [newFarmSoilType, setNewFarmSoilType] = useState('Unknown');

    // Map layer state
    const [activeLayer, setActiveLayer] = useState('satellite');
    const [showLayerMenu, setShowLayerMenu] = useState(false);

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingPoints, setDrawingPoints] = useState([]);
    const [tempArea, setTempArea] = useState(0);

    // Handle map click
    const handleMapClick = async (latlng, drawing) => {
        if (drawing) {
            // Add point to polygon
            const newPoints = [...drawingPoints, [latlng.lat, latlng.lng]];
            setDrawingPoints(newPoints);

            // Calculate area if we have at least 3 points
            if (newPoints.length >= 3) {
                const area = calculatePolygonArea(newPoints);
                setTempArea(area);
            }
        } else {
            // Single point selection for new farm
            setSelectedLocation(latlng);
            try {
                const imageUrl = `http://localhost:5000/get_sample_image?lat=${latlng.lat}&lon=${latlng.lng}&t=${Date.now()}`;
                setSatellitePreview(imageUrl);
                setShowAddFarmDialog(true);
            } catch (error) {
                console.error('Error fetching satellite image:', error);
            }
        }
    };

    // Start drawing mode
    const startDrawing = () => {
        setIsDrawing(true);
        setDrawingPoints([]);
        setTempArea(0);
        toast.info('Click on the map to draw farm boundary. Click "Finish" when done.');
    };

    // Finish drawing
    const finishDrawing = () => {
        if (drawingPoints.length < 3) {
            toast.error('Please select at least 3 points to create a boundary');
            return;
        }

        const area = calculatePolygonArea(drawingPoints);
        setTempArea(area);
        setIsDrawing(false);

        // Calculate center of polygon
        const centerLat = drawingPoints.reduce((sum, p) => sum + p[0], 0) / drawingPoints.length;
        const centerLng = drawingPoints.reduce((sum, p) => sum + p[1], 0) / drawingPoints.length;

        setSelectedLocation({ lat: centerLat, lng: centerLng });
        setShowAddFarmDialog(true);
    };

    // Cancel drawing
    const cancelDrawing = () => {
        setIsDrawing(false);
        setDrawingPoints([]);
        setTempArea(0);
        toast.info('Drawing cancelled');
    };

    // Undo last point
    const undoLastPoint = () => {
        if (drawingPoints.length > 0) {
            const newPoints = drawingPoints.slice(0, -1);
            setDrawingPoints(newPoints);
            if (newPoints.length >= 3) {
                setTempArea(calculatePolygonArea(newPoints));
            } else {
                setTempArea(0);
            }
        }
    };

    // Add farm
    const handleAddFarm = () => {
        if (!selectedLocation || !newFarmName) {
            toast.error('Please enter a farm name');
            return;
        }

        const areaValue = drawingPoints.length >= 3 ? calculatePolygonArea(drawingPoints) : 0;

        const newFarm = {
            id: Date.now(),
            name: newFarmName,
            area: areaValue > 0 ? formatArea(areaValue) : '0 acres',
            areaValue: areaValue,
            soilType: newFarmSoilType,
            coordinates: { lat: selectedLocation.lat, lng: selectedLocation.lng },
            boundary: drawingPoints.length >= 3 ? drawingPoints : null
        };

        setFarms([...farms, newFarm]);
        setShowAddFarmDialog(false);
        setNewFarmName('');
        setNewFarmSoilType('Unknown');
        setSatellitePreview(null);
        setSelectedLocation(null);
        setDrawingPoints([]);
        setTempArea(0);
        toast.success(`Farm "${newFarmName}" added successfully!`);
    };

    // Delete farm
    const deleteFarm = (id) => {
        const farmToDelete = farms.find(f => f.id === id);
        setFarms(farms.filter(farm => farm.id !== id));
        if (selectedFarm?.id === id) setSelectedFarm(null);
        toast.success(`Farm "${farmToDelete?.name}" removed`);
    };

    // Calculate total farm area
    const totalArea = farms.reduce((sum, farm) => sum + (farm.areaValue || 0), 0);

    // Get current layer config
    const currentLayer = MAP_LAYERS[activeLayer];

    return (
        <div className="my-farms">
            <div className="farms-header">
                <div>
                    <h1 className="page-title">My Farmlands</h1>
                    <p className="page-subtitle">
                        Manage your registered farm boundaries - Click on map to add new farm
                    </p>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-value">{farms.length}</span>
                        <span className="stat-label">Farms</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{formatArea(totalArea)}</span>
                        <span className="stat-label">Total Area</span>
                    </div>
                </div>
            </div>

            <div className="farms-layout">
                {/* Map Section */}
                <div className="map-section">
                    <div className="map-container-wrapper">
                        {/* Layer Selector */}
                        <div className="layer-selector">
                            <button
                                className="layer-toggle-btn"
                                onClick={() => setShowLayerMenu(!showLayerMenu)}
                            >
                                <Layers size={20} />
                            </button>
                            {showLayerMenu && (
                                <div className="layer-menu">
                                    {Object.entries(MAP_LAYERS).map(([key, layer]) => (
                                        <button
                                            key={key}
                                            className={`layer-option ${activeLayer === key ? 'active' : ''}`}
                                            onClick={() => {
                                                setActiveLayer(key);
                                                setShowLayerMenu(false);
                                            }}
                                        >
                                            <layer.icon size={18} />
                                            <span>{layer.name}</span>
                                            {activeLayer === key && <Check size={16} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Drawing Info Panel */}
                        {isDrawing && (
                            <div className="drawing-panel">
                                <div className="drawing-info">
                                    <Ruler size={18} />
                                    <span>Points: {drawingPoints.length}</span>
                                    {tempArea > 0 && (
                                        <span className="area-preview">Area: {formatArea(tempArea)}</span>
                                    )}
                                </div>
                                <div className="drawing-actions">
                                    <button className="btn-small" onClick={undoLastPoint} disabled={drawingPoints.length === 0}>
                                        Undo
                                    </button>
                                    <button className="btn-small btn-success" onClick={finishDrawing} disabled={drawingPoints.length < 3}>
                                        <Check size={16} /> Finish
                                    </button>
                                    <button className="btn-small btn-danger" onClick={cancelDrawing}>
                                        <X size={16} /> Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        <MapContainer
                            center={mapCenter}
                            zoom={mapZoom}
                            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                        >
                            <ChangeMapView center={mapCenter} zoom={mapZoom} />

                            {/* Main map layer */}
                            <TileLayer
                                key={activeLayer}
                                url={currentLayer.url}
                                attribution={currentLayer.attribution}
                            />

                            {/* Labels overlay for satellite view */}
                            {activeLayer === 'satellite' && (
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
                                    attribution='&copy; CARTO'
                                    pane="shadowPane"
                                />
                            )}

                            {/* Farm markers and boundaries */}
                            {farms.map(farm => (
                                <React.Fragment key={farm.id}>
                                    {farm.boundary && (
                                        <Polygon
                                            positions={farm.boundary}
                                            pathOptions={{
                                                color: selectedFarm?.id === farm.id ? '#16a34a' : '#22c55e',
                                                fillColor: selectedFarm?.id === farm.id ? '#16a34a' : '#22c55e',
                                                fillOpacity: 0.3,
                                                weight: selectedFarm?.id === farm.id ? 3 : 2
                                            }}
                                            eventHandlers={{
                                                click: () => setSelectedFarm(farm)
                                            }}
                                        />
                                    )}
                                    <Marker
                                        position={[farm.coordinates.lat, farm.coordinates.lng]}
                                        eventHandlers={{
                                            click: () => {
                                                setSelectedFarm(farm);
                                                setMapCenter([farm.coordinates.lat, farm.coordinates.lng]);
                                                setMapZoom(14);
                                            }
                                        }}
                                    >
                                        <Popup>
                                            <strong>{farm.name}</strong><br />
                                            {farm.area} • {farm.soilType}
                                        </Popup>
                                    </Marker>
                                </React.Fragment>
                            ))}

                            {/* Drawing polygon preview */}
                            {drawingPoints.length >= 2 && (
                                <Polygon
                                    positions={drawingPoints}
                                    pathOptions={{
                                        color: '#f59e0b',
                                        fillColor: '#f59e0b',
                                        fillOpacity: 0.2,
                                        weight: 2,
                                        dashArray: '5, 5'
                                    }}
                                />
                            )}

                            {/* Drawing point markers */}
                            {isDrawing && drawingPoints.map((point, idx) => (
                                <Marker
                                    key={idx}
                                    position={point}
                                    icon={L.divIcon({
                                        className: 'drawing-marker',
                                        html: `<div class="marker-dot">${idx + 1}</div>`,
                                        iconSize: [24, 24],
                                        iconAnchor: [12, 12]
                                    })}
                                />
                            ))}

                            <MapClickHandler onMapClick={handleMapClick} isDrawing={isDrawing} />
                        </MapContainer>
                    </div>

                    <div className="map-tools">
                        <button
                            className={`tool-btn ${isDrawing ? 'active' : ''}`}
                            onClick={isDrawing ? cancelDrawing : startDrawing}
                        >
                            <Square size={18} />
                            {isDrawing ? 'Cancel Drawing' : 'Draw Boundary'}
                        </button>
                        <button className="tool-btn" onClick={() => toast.info('Click anywhere on the map to add a point marker')}>
                            <MapPin size={18} />
                            Add Point
                        </button>
                        <button className="tool-btn" onClick={() => {
                            setMapCenter([20.5937, 78.9629]);
                            setMapZoom(6);
                        }}>
                            <Map size={18} />
                            Reset View
                        </button>
                    </div>
                </div>

                {/* Farms List Section */}
                <div className="farms-list-section">
                    <h3 className="list-title">Registered Farms ({farms.length})</h3>

                    <div className="farms-list">
                        {farms.map(farm => (
                            <div
                                key={farm.id}
                                className={`farm-item ${selectedFarm?.id === farm.id ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedFarm(farm);
                                    setMapCenter([farm.coordinates.lat, farm.coordinates.lng]);
                                    setMapZoom(farm.boundary ? 15 : 14);
                                }}
                            >
                                <div className="farm-icon">
                                    {farm.boundary ? <Square size={20} /> : <MapPin size={20} />}
                                </div>
                                <div className="farm-details">
                                    <h4 className="farm-name">{farm.name}</h4>
                                    <p className="farm-meta">
                                        <span className="farm-area-badge">{farm.area}</span>
                                        <span className="farm-soil">{farm.soilType}</span>
                                    </p>
                                    <p className="farm-coords">
                                        {farm.coordinates.lat.toFixed(4)}°N, {farm.coordinates.lng.toFixed(4)}°E
                                    </p>
                                    {farm.boundary && (
                                        <p className="farm-boundary-info">
                                            <Square size={12} /> {farm.boundary.length} boundary points
                                        </p>
                                    )}
                                </div>
                                <button
                                    className="delete-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteFarm(farm.id);
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {farms.length === 0 && (
                        <div className="no-farms-message">
                            <MapPin size={48} />
                            <p>No farms registered yet</p>
                            <p className="hint">Click on the map or use "Draw Boundary" to add your first farm</p>
                        </div>
                    )}

                    <div className="total-area-card">
                        <div className="total-area-icon">
                            <Ruler size={24} />
                        </div>
                        <div className="total-area-info">
                            <span className="total-area-label">Total Farm Area</span>
                            <span className="total-area-value">{formatArea(totalArea)}</span>
                        </div>
                    </div>

                    <div className="farm-ready-message">
                        <p>Your land is now ready for crop prediction.</p>
                    </div>
                </div>
            </div>

            {/* Add Farm Dialog */}
            {showAddFarmDialog && (
                <div className="dialog-overlay" onClick={() => {
                    setShowAddFarmDialog(false);
                    setDrawingPoints([]);
                    setTempArea(0);
                }}>
                    <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="dialog-title">Add New Farm</h3>

                        {satellitePreview && (
                            <div className="satellite-preview-dialog">
                                <img src={satellitePreview} alt="Satellite Preview" />
                            </div>
                        )}

                        <div className="dialog-info">
                            <p><strong>Location:</strong> {selectedLocation?.lat.toFixed(4)}°N, {selectedLocation?.lng.toFixed(4)}°E</p>
                            {drawingPoints.length >= 3 && (
                                <p className="area-info">
                                    <strong>Calculated Area:</strong> {formatArea(tempArea)}
                                    <span className="boundary-points">({drawingPoints.length} boundary points)</span>
                                </p>
                            )}
                        </div>

                        <div className="dialog-form">
                            <div className="form-group">
                                <label>Farm Name:</label>
                                <input
                                    type="text"
                                    value={newFarmName}
                                    onChange={(e) => setNewFarmName(e.target.value)}
                                    placeholder="Enter farm name..."
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Soil Type:</label>
                                <select
                                    value={newFarmSoilType}
                                    onChange={(e) => setNewFarmSoilType(e.target.value)}
                                >
                                    <option value="Unknown">Unknown</option>
                                    <option value="Loamy">Loamy</option>
                                    <option value="Sandy">Sandy</option>
                                    <option value="Clay">Clay</option>
                                    <option value="Silty">Silty</option>
                                    <option value="Peaty">Peaty</option>
                                    <option value="Chalky">Chalky</option>
                                </select>
                            </div>
                        </div>

                        <div className="dialog-actions">
                            <button className="btn btn-secondary" onClick={() => {
                                setShowAddFarmDialog(false);
                                setDrawingPoints([]);
                                setTempArea(0);
                            }}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleAddFarm}>
                                <Plus size={18} />
                                Add Farm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyFarms;
