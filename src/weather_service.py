"""
Weather Service module for GeoCrop Predictor.
Integrates with OpenWeatherMap API for real-time weather data.
"""

import requests
import time
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from config import config

logger = logging.getLogger(__name__)

# In-memory cache for weather data
_weather_cache: Dict[str, Dict[str, Any]] = {}
CACHE_DURATION_SECONDS = 30 * 60  # 30 minutes


@dataclass
class WeatherData:
    """Current weather data."""
    temperature: float
    humidity: int
    wind_speed: float
    condition: str
    icon: str
    description: str
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ForecastDay:
    """Single day forecast data."""
    date: str
    temp_high: float
    temp_low: float
    condition: str
    icon: str
    
    def to_dict(self) -> dict:
        return asdict(self)


class WeatherServiceError(Exception):
    """Custom exception for weather service errors."""
    pass


class WeatherService:
    """Service for fetching weather data from OpenWeatherMap API."""
    
    BASE_URL = "https://api.openweathermap.org/data/2.5"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize WeatherService.
        
        Args:
            api_key: OpenWeatherMap API key. If None, uses config.
        """
        # Use provided api_key if it's a non-empty string, otherwise fall back to config
        if api_key is not None:
            self.api_key = api_key if api_key else None
        else:
            self.api_key = config.OPENWEATHER_API_KEY
    
    def is_configured(self) -> bool:
        """Check if the service is properly configured."""
        return bool(self.api_key)
    
    def _get_cache_key(self, lat: float, lon: float) -> str:
        """Generate cache key from coordinates (rounded to 2 decimals)."""
        return f"{round(lat, 2)}_{round(lon, 2)}"
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid."""
        if cache_key not in _weather_cache:
            return False
        
        cached = _weather_cache[cache_key]
        age = time.time() - cached.get('timestamp', 0)
        return age < CACHE_DURATION_SECONDS
    
    def _get_from_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get data from cache if valid."""
        if self._is_cache_valid(cache_key):
            logger.info(f"Using cached weather data for {cache_key}")
            return _weather_cache[cache_key]['data']
        return None
    
    def _save_to_cache(self, cache_key: str, data: Dict[str, Any]) -> None:
        """Save data to cache with timestamp."""
        _weather_cache[cache_key] = {
            'timestamp': time.time(),
            'data': data
        }
    
    def get_current_weather(self, lat: float, lon: float) -> WeatherData:
        """
        Get current weather for given coordinates.
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            WeatherData object with current conditions
            
        Raises:
            WeatherServiceError: If API call fails
        """
        if not self.is_configured():
            raise WeatherServiceError("Weather service not configured")
        
        try:
            url = f"{self.BASE_URL}/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return WeatherData(
                temperature=round(data['main']['temp'], 1),
                humidity=data['main']['humidity'],
                wind_speed=round(data['wind']['speed'] * 3.6, 1),  # m/s to km/h
                condition=data['weather'][0]['main'],
                icon=data['weather'][0]['icon'],
                description=data['weather'][0]['description']
            )
            
        except requests.RequestException as e:
            logger.error(f"Weather API error: {e}")
            raise WeatherServiceError(f"Failed to fetch weather: {str(e)}")
    
    def get_forecast(self, lat: float, lon: float, days: int = 5) -> List[ForecastDay]:
        """
        Get weather forecast for given coordinates.
        
        Args:
            lat: Latitude
            lon: Longitude
            days: Number of days to forecast (max 5 for free tier)
            
        Returns:
            List of ForecastDay objects
            
        Raises:
            WeatherServiceError: If API call fails
        """
        if not self.is_configured():
            raise WeatherServiceError("Weather service not configured")
        
        try:
            url = f"{self.BASE_URL}/forecast"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Group forecasts by day and get daily high/low
            daily_data = {}
            for item in data['list']:
                date = item['dt_txt'].split(' ')[0]
                if date not in daily_data:
                    daily_data[date] = {
                        'temps': [],
                        'condition': item['weather'][0]['main'],
                        'icon': item['weather'][0]['icon']
                    }
                daily_data[date]['temps'].append(item['main']['temp'])
            
            # Convert to ForecastDay objects
            forecasts = []
            for date, info in list(daily_data.items())[:days]:
                forecasts.append(ForecastDay(
                    date=date,
                    temp_high=round(max(info['temps']), 1),
                    temp_low=round(min(info['temps']), 1),
                    condition=info['condition'],
                    icon=info['icon']
                ))
            
            return forecasts
            
        except requests.RequestException as e:
            logger.error(f"Forecast API error: {e}")
            raise WeatherServiceError(f"Failed to fetch forecast: {str(e)}")
    
    def get_weather_with_forecast(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Get both current weather and forecast with caching.
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            Dictionary with 'current' and 'forecast' keys
        """
        cache_key = self._get_cache_key(lat, lon)
        
        # Check cache first
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data
        
        # Fetch fresh data
        current = self.get_current_weather(lat, lon)
        forecast = self.get_forecast(lat, lon)
        
        result = {
            'current': current.to_dict(),
            'forecast': [f.to_dict() for f in forecast]
        }
        
        # Save to cache
        self._save_to_cache(cache_key, result)
        
        return result


# Global service instance
weather_service = WeatherService()
