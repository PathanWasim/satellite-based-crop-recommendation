# GeoCrop 🌾🛰️

**Intelligent Crop Recommendation System Using Satellite Imagery & Machine Learning**

GeoCrop is an advanced agricultural decision support system that combines deep learning, real-time satellite imagery, and environmental data to provide accurate crop recommendations for farmers. Built with PyTorch and React, it features a novel multi-modal fusion architecture that adapts to data quality for robust predictions.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-red.svg)](https://pytorch.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Key Features

### Core Functionality
- **Multi-Modal Deep Learning** - LiteGeoNet architecture with gating fusion mechanism
- **Real-Time Satellite Data** - Sentinel-2 imagery via Sentinel Hub API with automatic fallback
- **Live Weather Integration** - Current conditions and 5-day forecasts from OpenWeatherMap
- **AI-Powered Assistant** - Gemini AI chatbot for farming advice and crop guidance
- **Interactive Mapping** - Leaflet.js-based farm location selection with precise coordinates
- **Comprehensive Reporting** - PDF generation with charts, predictions, and recommendations

### User Experience
- **Dark/Light Theme** - Full theme support with persistent preferences
- **Prediction History** - Track all past predictions with search and filter
- **Persistent Storage** - Browser-based localStorage for offline access
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Real-Time Updates** - Live weather data and satellite image previews

---

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Python 3.8+ with Flask web framework
- PyTorch 2.0+ for deep learning inference
- EfficientNet-B0 as image backbone (timm library)
- Flask-CORS for cross-origin requests
- python-dotenv for configuration management

**Frontend:**
- React 19 with modern hooks and context API
- Vite for fast development and optimized builds
- React Router v7 for navigation
- Leaflet.js for interactive maps
- Recharts for data visualization
- jsPDF for report generation
- Lucide React for beautiful icons

**APIs & Services:**
- Sentinel Hub API - Satellite imagery (Sentinel-2 L2A)
- OpenWeatherMap API - Weather data and forecasts
- Google Gemini AI - Conversational assistant

**Dataset:**
- EuroSAT: 27,000 labeled Sentinel-2 images
- 10 land use classes at 64x64 resolution
- Custom crop dataset with soil and weather parameters

### LiteGeoNet Model

Novel multi-modal architecture featuring:
- **Image Branch**: EfficientNet-B0 backbone (1280-dim features)
- **Tabular Branch**: MLP for soil/weather data (32-dim features)
- **Gating Fusion**: Learned weights for adaptive feature combination
- **Classification Head**: Final crop prediction with confidence scores

The gating mechanism dynamically weights image vs. tabular features based on data quality, improving robustness when satellite images are cloudy or environmental data is uncertain.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- pip and npm package managers

### Installation

**1. Clone Repository**
```bash
git clone https://github.com/PathanWasim/satellite-based-crop-recommendation.git
cd satellite-based-crop-recommendation
```

**2. Backend Setup**
```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

**3. Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys:
# - SENTINEL_CLIENT_ID and SENTINEL_CLIENT_SECRET from https://apps.sentinel-hub.com/
# - OPENWEATHER_API_KEY from https://openweathermap.org/api
# - GEMINI_API_KEY from https://makersuite.google.com/app/apikey
```

**4. Frontend Setup**
```bash
cd frontend
npm install
```

**5. Run Application**
```bash
# Terminal 1 - Start Backend (from project root)
cd src
python app.py

# Terminal 2 - Start Frontend (from project root)
cd frontend
npm run dev
```

**6. Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 📖 Usage Guide

### Making Predictions

1. **Select Location**: Click on the interactive map to choose your farm location
2. **View Satellite Image**: Real-time Sentinel-2 image loads automatically
3. **Enter Soil Data**: Input N, P, K, and pH values from soil tests
4. **Add Weather Info**: Provide rainfall and temperature data
5. **Get Prediction**: Click "Predict Crop" to receive recommendations
6. **View Results**: See predicted crop, confidence score, and gating weights
7. **Download Report**: Generate PDF report with detailed analysis

### Using AI Assistant

1. Navigate to the Assistant page
2. Ask questions about crops, soil, pests, weather, or farming practices
3. Get instant, context-aware responses from Gemini AI
4. Chat history is automatically saved for reference

### Managing History

1. View all past predictions on the History page
2. Search and filter by crop, date, or confidence
3. Download individual prediction reports as PDF
4. Delete old predictions to manage storage

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Get From |
|----------|----------|-------------|----------|
| `SENTINEL_CLIENT_ID` | No* | Sentinel Hub client ID | [Sentinel Hub Dashboard](https://apps.sentinel-hub.com/) |
| `SENTINEL_CLIENT_SECRET` | No* | Sentinel Hub client secret | [Sentinel Hub Dashboard](https://apps.sentinel-hub.com/) |
| `OPENWEATHER_API_KEY` | No* | OpenWeatherMap API key | [OpenWeatherMap API](https://openweathermap.org/api) |
| `GEMINI_API_KEY` | No* | Google Gemini API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `FLASK_DEBUG` | No | Enable Flask debug mode | Set to `true` or `false` |

*Not strictly required - system will use fallback mechanisms if not configured

### API Rate Limits

- **Sentinel Hub**: 1000 requests/month (free tier)
- **OpenWeatherMap**: 1000 calls/day (free tier)
- **Gemini AI**: 60 requests/minute (free tier)

---

## 📊 Model Training

### Training on Custom Data

```bash
# Prepare your dataset in CSV format with columns:
# image_path, crop_label, ph, N, P, K, rainfall, temp, lat, lon

# Train model
cd src
python train.py  # For small dataset
python train_full.py  # For full EuroSAT dataset

# Model checkpoint saved to model_checkpoint.pth
```

### Dataset Format

```csv
image_path,crop_label,ph,N,P,K,rainfall,temp,lat,lon
images/field_1.png,Wheat,6.5,50,30,40,800,25,20.5,78.9
images/field_2.png,Rice,7.0,60,35,45,1200,28,22.3,80.1
```

---

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=src --cov-report=html

# Run specific test file
pytest src/tests/test_model.py

# Run with verbose output
pytest -v
```

---

## 📚 Documentation

- **Technical Documentation**: See [GeoCrop.md](GeoCrop.md) for comprehensive technical details
- **API Reference**: Detailed endpoint documentation in technical docs
- **Model Architecture**: In-depth explanation of LiteGeoNet in technical docs

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Code follows PEP 8 (Python) and ESLint (JavaScript) standards
- All tests pass before submitting PR
- New features include appropriate tests
- Documentation is updated as needed

---

## 🐛 Troubleshooting

**Backend won't start:**
- Verify Python 3.8+ is installed
- Check all dependencies are installed: `pip install -r requirements.txt`
- Ensure model checkpoint file exists in `src/`

**Frontend connection issues:**
- Confirm backend is running on port 5000
- Check CORS configuration in `src/app.py`
- Verify frontend is accessing correct API URL

**Satellite images not loading:**
- System automatically falls back to local EuroSAT images
- Check Sentinel Hub credentials if using real-time data
- Verify internet connection

**Weather data unavailable:**
- Verify OpenWeatherMap API key is valid
- Check API rate limits haven't been exceeded
- Ensure coordinates are within valid ranges

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Academic Use:** This is an educational project demonstrating machine learning applications in agriculture.

---

## 🙏 Acknowledgments

- **EuroSAT Dataset**: Helber et al. for the comprehensive satellite image dataset
- **EfficientNet**: Google Research for the efficient CNN architecture
- **Sentinel-2**: ESA Copernicus Programme for free satellite data access
- **OpenWeatherMap**: For weather data API
- **Google Gemini**: For AI assistant capabilities

---

## 📧 Contact

**Author**: PathanWasim  
**Repository**: [satellite-based-crop-recommendation](https://github.com/PathanWasim/satellite-based-crop-recommendation)  
**Issues**: [GitHub Issues](https://github.com/PathanWasim/satellite-based-crop-recommendation/issues)

---

**⭐ Star this repository if you find it helpful!**
