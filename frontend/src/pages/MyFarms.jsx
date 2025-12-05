import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Plus, MapPin, Trash2, Edit, Upload } from 'lucide-react';
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

const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        },
    });
    return null;
};

const MyFarms = () => {
    const toast = useToast();

    // Load farms from localStorage or use defaults
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
                soilType: 'Loamy',
                coordinates: { lat: 28.6139, lng: 77.2090 }
            },
            {
                id: 2,
                name: 'South Orchard',
                area: '8.2 acres',
                soilType: 'Sandy',
                coordinates: { lat: 28.5355, lng: 77.3910 }
            },
            {
                id: 3,
                name: 'River Plot',
                area: '15.0 acres',
                soilType: 'Clay',
                coordinates: { lat: 28.4595, lng: 77.0266 }
            }
        ];
    });

    // Save farms to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('myFarms', JSON.stringify(farms));
    }, [farms]);

    const [selectedFarm, setSelectedFarm] = useState(null);
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [satellitePreview, setSatellitePreview] = useState(null);
    const [showAddFarmDialog, setShowAddFarmDialog] = useState(false);
    const [newFarmName, setNewFarmName] = useState('');

    const handleMapClick = async (latlng) => {
        console.log('Map clicked at:', latlng);
        setSelectedLocation(latlng);

        // Fetch satellite image for the clicked location
        try {
            const imageUrl = `http://localhost:5000/get_sample_image?lat=${latlng.lat}&lon=${latlng.lng}&t=${Date.now()}`;
            setSatellitePreview(imageUrl);
            setShowAddFarmDialog(true);
        } catch (error) {
            console.error('Error fetching satellite image:', error);
        }
    };

    const handleAddFarm = () => {
        if (!selectedLocation || !newFarmName) {
            toast.error('Please enter a farm name');
            return;
        }

        const newFarm = {
            id: Date.now(), // Use timestamp as unique ID
            name: newFarmName,
            area: '0 acres',
            soilType: 'Unknown',
            coordinates: { lat: selectedLocation.lat, lng: selectedLocation.lng }
        };

        setFarms([...farms, newFarm]);
        setShowAddFarmDialog(false);
        setNewFarmName('');
        setSatellitePreview(null);
        setSelectedLocation(null);
        toast.success(`Farm "${newFarmName}" added successfully!`);
    };

    const deleteFarm = (id) => {
        const farmToDelete = farms.find(f => f.id === id);
        setFarms(farms.filter(farm => farm.id !== id));
        toast.success(`Farm "${farmToDelete?.name}" removed`);
    };

    return (
        <div className="my-farms">
            <div className="farms-header">
                <div>
                    <h1 className="page-title">My Farmlands</h1>
                    <p className="page-subtitle">Manage your registered farm boundaries - Click on map to add new farm</p>
                </div>
                <button className="btn btn-primary" onClick={() => toast.info('Click on the map to add a new farm!')}>
                    <Plus size={20} />
                    Add New Farm
                </button>
            </div>

            <div className="farms-layout">
                {/* Map Section */}
                <div className="map-section">
                    <div className="map-container-wrapper">
                        <MapContainer
                            center={mapCenter}
                            zoom={6}
                            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                        >
                            {/* Satellite imagery layer */}
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution='&copy; Esri'
                            />
                            {/* Labels layer for city/area names */}
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors, &copy; CARTO'
                                pane="shadowPane"
                            />
                            {farms.map(farm => (
                                <Marker
                                    key={farm.id}
                                    position={[farm.coordinates.lat, farm.coordinates.lng]}
                                    eventHandlers={{
                                        click: () => setSelectedFarm(farm)
                                    }}
                                >
                                    <Popup>
                                        <strong>{farm.name}</strong><br />
                                        {farm.area} • {farm.soilType}
                                    </Popup>
                                </Marker>
                            ))}
                            <MapClickHandler onMapClick={handleMapClick} />
                        </MapContainer>
                    </div>

                    <div className="map-tools">
                        <button className="tool-btn">
                            <Edit size={18} />
                            Draw Boundary
                        </button>
                        <button className="tool-btn">
                            <Upload size={18} />
                            Upload Image
                        </button>
                        <button className="tool-btn">
                            <MapPin size={18} />
                            Auto-detect
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
                                }}
                            >
                                <div className="farm-icon">
                                    <MapPin size={20} />
                                </div>
                                <div className="farm-details">
                                    <h4 className="farm-name">{farm.name}</h4>
                                    <p className="farm-meta">{farm.area} • {farm.soilType}</p>
                                    <p className="farm-coords">
                                        {farm.coordinates.lat.toFixed(4)}°N, {farm.coordinates.lng.toFixed(4)}°E
                                    </p>
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

                    <div className="farm-ready-message">
                        <p>Your land is now ready for crop prediction.</p>
                    </div>
                </div>
            </div>

            {/* Add Farm Dialog */}
            {showAddFarmDialog && (
                <div className="dialog-overlay" onClick={() => setShowAddFarmDialog(false)}>
                    <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="dialog-title">Add New Farm</h3>

                        {satellitePreview && (
                            <div className="satellite-preview-dialog">
                                <img src={satellitePreview} alt="Satellite Preview" />
                            </div>
                        )}

                        <div className="dialog-info">
                            <p><strong>Location:</strong> {selectedLocation?.lat.toFixed(4)}°N, {selectedLocation?.lng.toFixed(4)}°E</p>
                        </div>

                        <div className="dialog-form">
                            <label>Farm Name:</label>
                            <input
                                type="text"
                                value={newFarmName}
                                onChange={(e) => setNewFarmName(e.target.value)}
                                placeholder="Enter farm name..."
                                autoFocus
                            />
                        </div>

                        <div className="dialog-actions">
                            <button className="btn btn-secondary" onClick={() => setShowAddFarmDialog(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleAddFarm}>
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
