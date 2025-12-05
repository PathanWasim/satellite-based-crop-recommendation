# GeoCrop 🌾🛰️

A smart crop prediction system using satellite imagery and machine learning.

## Features

- **AI-Powered Predictions** - Deep learning model (LiteGeoNet) combining satellite imagery with soil/weather data
- **Real-Time Satellite Imagery** - Sentinel-2 satellite images via Sentinel Hub API
- **Live Weather Data** - OpenWeatherMap integration for current conditions and forecasts
- **Interactive Maps** - Leaflet.js maps for farm location selection
- **Dark Mode** - Full dark/light theme support
- **PDF Reports** - Download detailed prediction reports
- **Prediction History** - Track all past predictions with persistent storage

## Tech Stack

**Backend:** Python, Flask, PyTorch, EfficientNet-B0

**Frontend:** React 19, Vite, Leaflet, Recharts, jsPDF

**APIs:** Sentinel Hub, OpenWeatherMap

## Quick Start

### 1. Clone & Setup Backend
```bash
git clone https://github.com/PathanWasim/satellite-based-crop-recommendation.git
cd satellite-based-crop-recommendation
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

### 4. Run Application
```bash
# Terminal 1 - Backend
cd src && python app.py

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

Visit `http://localhost:5173`

## Environment Variables

```env
SENTINEL_CLIENT_ID=your_sentinel_client_id
SENTINEL_CLIENT_SECRET=your_sentinel_client_secret
OPENWEATHER_API_KEY=your_openweathermap_api_key
```

## Dataset

This project uses the EuroSAT dataset for training. Download it separately:
- [EuroSAT Dataset](https://github.com/phelber/EuroSAT)

Place the extracted folder in `data/eurosat/2750/`

## Data Persistence

All prediction history and farm data is stored in browser's localStorage - your data persists even after closing the browser.

## Screenshots

The application includes:
- Dashboard with weather widget and quick actions
- Interactive farm management with map
- Crop prediction with confidence scores
- History page with PDF download option
- Detailed reports with charts

## License

Academic project for educational purposes.
