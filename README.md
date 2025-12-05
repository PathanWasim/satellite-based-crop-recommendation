# GeoCrop Predictor 🌾🛰️

## Overview
**GeoCrop Predictor** is an end-to-end machine learning system designed to predict crop types based on satellite imagery and ground truth soil/weather data. It utilizes a custom hybrid deep learning architecture, **LiteGeoNet**, which intelligently fuses visual features from Sentinel-2 satellite images with tabular agronomic data (pH, Rainfall, Temperature, etc.).

## Features
- **LiteGeoNet Model**: A hybrid model combining **EfficientNet-B0** (CNN for images) and a **Multi-Layer Perceptron** (MLP for tabular data) with a **Gating Fusion** mechanism to weigh the importance of each modality.
- **Modern React Frontend**: A responsive React-based web app with interactive **Leaflet.js** maps, toast notifications, and mobile-friendly navigation.
- **Real-Time Satellite Imagery**: Integrates with the **Sentinel Hub API** to fetch live Sentinel-2 satellite images for any selected location on the map.
- **Live Weather Data**: Integrates with **OpenWeatherMap API** for real-time weather conditions and 5-day forecasts.
- **Prediction History**: Track and review all past crop predictions with detailed parameters.
- **Explainable Predictions**: Provides confidence scores and "Gating Weights" to reveal whether the model relied more on the satellite image or the soil data for its prediction.

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd geo_crop_project
```

### 2. Backend Setup

#### Install Python dependencies
```bash
pip install -r requirements.txt
```

#### Configure Environment Variables
Copy the example environment file and add your API keys:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Sentinel Hub API (for satellite imagery)
# Get credentials from: https://apps.sentinel-hub.com/dashboard/
SENTINEL_CLIENT_ID=your_sentinel_client_id
SENTINEL_CLIENT_SECRET=your_sentinel_client_secret

# OpenWeatherMap API (for weather data)
# Get free API key from: https://openweathermap.org/api
OPENWEATHER_API_KEY=your_openweathermap_api_key

# Flask settings
FLASK_DEBUG=true
```

> **Note**: If Sentinel Hub credentials are not provided, the app will use local EuroSAT images as fallback. Weather features require the OpenWeatherMap API key.

### 3. Frontend Setup
```bash
cd frontend
npm install
```

## Usage

### 1. Training the Model
To train the model from scratch using the EuroSAT dataset and synthetic tabular data:
```bash
cd src
python train_full.py
```
This will save the trained model checkpoint to `src/model_checkpoint_full.pth`.

### 2. Running the Application

#### Start the Backend (Flask API)
```bash
cd src
python app.py
```
The API will be available at `http://localhost:5000`

#### Start the Frontend (React)
In a new terminal:
```bash
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:5173`

### 3. Using the App
1. **Add Farms**: Navigate to "My Farms" and click on the map to register your farmland locations.
2. **Make Predictions**: Go to "Predictions", select a farm, adjust soil/weather parameters, and click "Predict".
3. **View Results**: See detailed prediction results with confidence scores and recommendations.
4. **Track History**: Review all past predictions in the "History" page.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serves the Flask template (legacy) |
| `/get_sample_image` | GET | Fetches satellite image for coordinates |
| `/predict` | POST | Makes crop prediction with image and parameters |
| `/api/weather` | GET | Returns current weather and 5-day forecast |
| `/api/health` | GET | Health check with configuration status |

## Project Structure
```
geo_crop_project/
├── data/                      # Dataset and CSVs
│   ├── eurosat/               # Satellite images (EuroSAT dataset)
│   └── crops_full.csv         # Tabular training data
├── src/                       # Backend source code
│   ├── app.py                 # Flask Web App
│   ├── config.py              # Environment configuration
│   ├── weather_service.py     # OpenWeatherMap integration
│   ├── model.py               # LiteGeoNet Architecture
│   ├── train_full.py          # Training Script
│   ├── dataset.py             # Data Loaders
│   ├── templates/             # Flask HTML Templates
│   └── tests/                 # Backend tests
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React Context (Toast)
│   │   └── services/          # Frontend services (History)
│   └── package.json
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── requirements.txt           # Python Dependencies
└── README.md                  # Project Documentation
```

## Tech Stack

### Backend
- **Python 3.8+**
- **Flask** - Web framework
- **PyTorch** - Deep learning
- **timm** - EfficientNet models
- **Pandas** - Data processing

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Leaflet** - Interactive maps
- **Recharts** - Data visualization
- **Lucide React** - Icons

### External APIs
- **Sentinel Hub** - Satellite imagery
- **OpenWeatherMap** - Weather data

## Credits
- **EuroSAT Dataset**: Used for training the image classification component.
- **Sentinel Hub**: Used for fetching real-time satellite imagery.
- **OpenWeatherMap**: Used for weather data integration.

## License
This project is developed as a college project for academic purposes.
