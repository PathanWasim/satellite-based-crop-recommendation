import os
import torch
from flask import Flask, render_template, request, jsonify, send_file
from torchvision import transforms
from PIL import Image
import io
import random
import requests
import base64
import time

from model import LiteGeoNet
from config import config
from weather_service import weather_service, WeatherServiceError

from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for React frontend
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:5174"]}})

# --- Configuration ---
# Load credentials from environment via config module
SENTINEL_CLIENT_ID = config.SENTINEL_CLIENT_ID
SENTINEL_CLIENT_SECRET = config.SENTINEL_CLIENT_SECRET

# Try to load the full model, fallback to the simple one
CHECKPOINT_PATH = 'model_checkpoint_full.pth'
if not os.path.exists(CHECKPOINT_PATH):
    CHECKPOINT_PATH = 'model_checkpoint.pth'

print(f"Loading model from {CHECKPOINT_PATH}...")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load Checkpoint & Model
checkpoint = torch.load(CHECKPOINT_PATH, map_location=device)
crop_classes = checkpoint['crop_classes']
tab_columns = checkpoint['tab_columns']

model = LiteGeoNet(num_classes=len(crop_classes), num_tabular_features=len(tab_columns))
model.load_state_dict(checkpoint['model_state_dict'])
model.to(device)
model.eval()

# Transforms
transform = transforms.Compose([
    transforms.Resize((64, 64)), # EuroSAT size
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# --- Sentinel Hub Helpers ---
def get_auth_token():
    """Get authentication token from Sentinel Hub."""
    if not config.is_sentinel_configured():
        raise ValueError("Sentinel Hub credentials not configured")
    
    url = "https://services.sentinel-hub.com/oauth/token"
    payload = {
        "grant_type": "client_credentials",
        "client_id": SENTINEL_CLIENT_ID,
        "client_secret": SENTINEL_CLIENT_SECRET
    }
    response = requests.post(url, data=payload)
    response.raise_for_status()
    return response.json()["access_token"]

def fetch_satellite_image(lat, lon):
    token = get_auth_token()
    
    # Define a bounding box (approx 640m x 640m)
    # 0.006 degrees is roughly 600-700m
    delta = 0.003
    bbox = [lon - delta, lat - delta, lon + delta, lat + delta]
    
    evalscript = """
    //VERSION=3
    function setup() {
      return {
        input: ["B04", "B03", "B02"],
        output: { bands: 3 }
      };
    }
    function evaluatePixel(sample) {
      return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
    }
    """
    
    url = "https://services.sentinel-hub.com/api/v1/process"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "input": {
            "bounds": {
                "bbox": bbox,
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
            },
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "timeRange": {
                        "from": "2023-01-01T00:00:00Z",
                        "to": "2023-12-31T23:59:59Z"
                    },
                    "mosaickingOrder": "leastCC"
                }
            }]
        },
        "output": {
            "width": 512,
            "height": 512,
            "responses": [{"identifier": "default", "format": {"type": "image/png"}}]
        },
        "evalscript": evalscript
    }
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.content

@app.route('/')
def index():
    return render_template('index.html')

def get_fallback_image():
    """Get a random local EuroSAT image as fallback."""
    image_dir = '../data/eurosat/2750/AnnualCrop'
    if not os.path.exists(image_dir):
        return None, 'Image directory not found'
    images = [f for f in os.listdir(image_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
    if not images:
        return None, 'No images found'
    selected_image = random.choice(images)
    return os.path.join(image_dir, selected_image), None


@app.route('/get_sample_image')
def get_sample_image():
    """
    Fetches a real satellite image from Sentinel Hub based on lat/lon.
    Falls back to local EuroSAT images if Sentinel Hub is not configured.
    """
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    
    # If no coordinates or Sentinel not configured, use fallback
    if lat is None or lon is None or not config.is_sentinel_configured():
        image_path, error = get_fallback_image()
        if error:
            return jsonify({'error': error}), 404
        return send_file(image_path, mimetype='image/jpg')

    try:
        image_bytes = fetch_satellite_image(lat, lon)
        return send_file(io.BytesIO(image_bytes), mimetype='image/png')
    except Exception as e:
        print(f"Error fetching satellite image: {e}. Falling back to local images.")
        # Fallback to local images on any error
        image_path, error = get_fallback_image()
        if error:
            return jsonify({'error': error}), 404
        return send_file(image_path, mimetype='image/jpg')

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    
    # Get Tabular Data from Form
    try:
        tab_data = []
        for col in tab_columns:
            val = float(request.form.get(col, 0.0))
            tab_data.append(val)
    except ValueError:
        return jsonify({'error': 'Invalid tabular data'}), 400

    # Process Image
    try:
        image = Image.open(file.stream).convert('RGB')
        image_tensor = transform(image).unsqueeze(0).to(device)
    except Exception as e:
        return jsonify({'error': f'Error processing image: {str(e)}'}), 400

    # Process Tabular
    tab_tensor = torch.tensor(tab_data, dtype=torch.float32).unsqueeze(0).to(device)

    # Inference
    with torch.no_grad():
        logits, gate_weights = model(image_tensor, tab_tensor)
        probabilities = torch.softmax(logits, dim=1)
        
        conf, pred_idx = torch.max(probabilities, 1)
        predicted_crop = crop_classes[pred_idx.item()]
        confidence = conf.item()
        
        w_img = gate_weights[0, 0].item()
        w_tab = gate_weights[0, 1].item()

    # Generate Recommendation Explanation
    recommendation = generate_recommendation(predicted_crop, tab_data, tab_columns)

    return jsonify({
        'crop': predicted_crop,
        'confidence': f"{confidence*100:.2f}%",
        'w_img': f"{w_img:.4f}",
        'w_tab': f"{w_tab:.4f}",
        'recommendation': recommendation
    })

def generate_recommendation(crop, tab_values, tab_names):
    """
    Generates a simple explanation based on the predicted crop and input data.
    """
    # Map values to names for easier access
    data = dict(zip(tab_names, tab_values))
    
    if crop == 'Rice':
        return (f"Recommended **Rice** due to high water availability (Rainfall: {data.get('rainfall', 0)}mm) "
                f"and suitable temperature ({data.get('temp', 0)}°C). Ensure field flooding is maintained.")
    elif crop == 'Wheat':
        return (f"Recommended **Wheat** as the conditions favor cool-season crops "
                f"(Temp: {data.get('temp', 0)}°C). Rainfall ({data.get('rainfall', 0)}mm) is moderate and suitable.")
    elif crop == 'Maize':
        return (f"Recommended **Maize** due to high nutrient levels (N: {data.get('N', 0)}). "
                f"This crop requires well-drained soil and good fertility.")
    elif crop == 'Forest':
        return "The area appears to be a **Forest**. Conservation is recommended over cultivation."
    else:
        return f"The model predicts **{crop}**. Please consult a local agronomist for specific advice."

@app.route('/api/weather')
def get_weather():
    """
    Get current weather and 5-day forecast for given coordinates.
    
    Query Parameters:
        lat: Latitude (required)
        lon: Longitude (required)
    
    Returns:
        JSON with 'current' weather and 'forecast' array
    """
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    
    if lat is None or lon is None:
        return jsonify({'error': 'Missing lat or lon parameters'}), 400
    
    if not weather_service.is_configured():
        return jsonify({
            'error': 'Weather service not configured',
            'message': 'Set OPENWEATHER_API_KEY environment variable'
        }), 503
    
    try:
        data = weather_service.get_weather_with_forecast(lat, lon)
        return jsonify(data)
    except WeatherServiceError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        print(f"Weather API error: {e}")
        return jsonify({'error': 'Weather service unavailable'}), 500


@app.route('/api/health')
def health_check():
    """
    Health check endpoint returning configuration status.
    
    Returns:
        JSON with service status and configuration state
    """
    return jsonify({
        'status': 'healthy',
        'sentinel_configured': config.is_sentinel_configured(),
        'weather_configured': config.is_weather_configured(),
        'model_loaded': model is not None,
        'crop_classes': crop_classes
    })


# Gemini AI Assistant Endpoint
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

FARMING_SYSTEM_PROMPT = """You are GeoCrop AI Assistant, a helpful farming and agriculture expert. You help farmers with:
- Crop recommendations based on soil and weather conditions
- Pest and disease identification and treatment
- Irrigation and water management advice
- Fertilizer recommendations
- Seasonal planting guides
- Weather impact on crops
- Soil health improvement tips
- Market trends and crop pricing

Keep responses concise, practical, and farmer-friendly. Use simple language. 
If asked about non-farming topics, politely redirect to agriculture-related help.
Format responses with bullet points when listing multiple items.
Include emojis occasionally to make responses engaging."""

@app.route('/api/chat', methods=['POST'])
def chat_with_gemini():
    """
    Proxy endpoint for Gemini AI chat.
    
    Request Body:
        message: User's message (required)
        history: Previous conversation history (optional)
    
    Returns:
        JSON with 'response' containing AI's reply
    """
    try:
        if not GEMINI_API_KEY:
            return jsonify({
                'error': 'Gemini API not configured',
                'message': 'Set GEMINI_API_KEY environment variable'
            }), 503
        
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        user_message = data['message']
        history = data.get('history', [])
        
        # Build conversation contents
        contents = [
            {'role': 'user', 'parts': [{'text': FARMING_SYSTEM_PROMPT}]},
            {'role': 'model', 'parts': [{'text': 'I understand. I am GeoCrop AI Assistant, ready to help with farming and agriculture questions.'}]}
        ]
        
        # Add conversation history (last 6 messages)
        for msg in history[-6:]:
            role = 'model' if msg.get('role') == 'assistant' else 'user'
            contents.append({
                'role': role,
                'parts': [{'text': msg.get('content', '')}]
            })
        
        # Add current message
        contents.append({
            'role': 'user',
            'parts': [{'text': user_message}]
        })
        
        # Call Gemini API using v1 endpoint with gemini-2.0-flash
        api_url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent'
        
        response = requests.post(
            f'{api_url}?key={GEMINI_API_KEY}',
            headers={'Content-Type': 'application/json'},
            json={
                'contents': contents,
                'generationConfig': {
                    'temperature': 0.7,
                    'maxOutputTokens': 1024
                }
            },
            timeout=30
        )
        
        if not response.ok:
            error_data = response.json() if response.text else {}
            error_msg = error_data.get('error', {}).get('message', 'API request failed')
            print(f"Gemini API error: {response.status_code} - {error_msg}")
            return jsonify({'error': error_msg}), response.status_code
        
        result = response.json()
        ai_response = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        
        if not ai_response:
            return jsonify({'error': 'No response generated'}), 500
        
        return jsonify({'response': ai_response})
        
    except requests.Timeout:
        return jsonify({'error': 'Request timed out. Please try again.'}), 504
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=config.DEBUG, port=5000)
