"""
Tests for the weather service module.
Uses pytest with hypothesis for property-based testing.
"""

import os
import sys
import time
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from weather_service import (
    WeatherService, WeatherData, ForecastDay, 
    WeatherServiceError, _weather_cache, CACHE_DURATION_SECONDS
)


class TestWeatherServiceUnit:
    """Unit tests for WeatherService class."""
    
    def setup_method(self):
        """Clear cache before each test."""
        _weather_cache.clear()
    
    def test_service_not_configured_without_key(self):
        """Test service reports not configured when no API key."""
        service = WeatherService(api_key='')
        assert service.is_configured() is False
    
    def test_service_configured_with_key(self):
        """Test service reports configured when API key provided."""
        service = WeatherService(api_key='test_key')
        assert service.is_configured() is True
    
    def test_cache_key_generation(self):
        """Test cache key is generated correctly from coordinates."""
        service = WeatherService(api_key='test')
        
        key1 = service._get_cache_key(28.6139, 77.2090)
        key2 = service._get_cache_key(28.61, 77.21)
        
        # Should round to 2 decimals
        assert key1 == "28.61_77.21"
        assert key1 == key2
    
    def test_cache_validity_empty(self):
        """Test cache reports invalid when empty."""
        service = WeatherService(api_key='test')
        assert service._is_cache_valid('nonexistent_key') is False
    
    def test_cache_save_and_retrieve(self):
        """Test saving and retrieving from cache."""
        service = WeatherService(api_key='test')
        test_data = {'current': {'temp': 25}, 'forecast': []}
        
        service._save_to_cache('test_key', test_data)
        retrieved = service._get_from_cache('test_key')
        
        assert retrieved == test_data
    
    def test_weather_data_to_dict(self):
        """Test WeatherData converts to dictionary correctly."""
        weather = WeatherData(
            temperature=25.5,
            humidity=65,
            wind_speed=12.3,
            condition='Clear',
            icon='01d',
            description='clear sky'
        )
        
        result = weather.to_dict()
        
        assert result['temperature'] == 25.5
        assert result['humidity'] == 65
        assert result['condition'] == 'Clear'
    
    def test_forecast_day_to_dict(self):
        """Test ForecastDay converts to dictionary correctly."""
        forecast = ForecastDay(
            date='2024-12-06',
            temp_high=30.0,
            temp_low=22.0,
            condition='Clouds',
            icon='03d'
        )
        
        result = forecast.to_dict()
        
        assert result['date'] == '2024-12-06'
        assert result['temp_high'] == 30.0
        assert result['temp_low'] == 22.0
    
    def test_get_current_weather_not_configured(self):
        """Test get_current_weather raises error when not configured."""
        service = WeatherService(api_key='')
        
        with pytest.raises(WeatherServiceError) as exc_info:
            service.get_current_weather(28.6, 77.2)
        
        assert "not configured" in str(exc_info.value)


class TestWeatherCachePropertyBased:
    """
    Property-based tests for weather caching.
    **Feature: geocrop-enhancements, Property 6: Weather Cache Validity**
    **Validates: Requirements 3.6**
    """
    
    def setup_method(self):
        """Clear cache before each test."""
        _weather_cache.clear()
    
    @given(
        lat=st.floats(min_value=-90, max_value=90, allow_nan=False),
        lon=st.floats(min_value=-180, max_value=180, allow_nan=False)
    )
    @settings(max_examples=100)
    def test_cache_key_deterministic(self, lat, lon):
        """
        Property: Cache key generation should be deterministic.
        Same coordinates should always produce same key.
        """
        service = WeatherService(api_key='test')
        
        key1 = service._get_cache_key(lat, lon)
        key2 = service._get_cache_key(lat, lon)
        
        assert key1 == key2
    
    @given(
        lat=st.floats(min_value=-90, max_value=90, allow_nan=False),
        lon=st.floats(min_value=-180, max_value=180, allow_nan=False),
        temp=st.floats(min_value=-50, max_value=50, allow_nan=False),
        humidity=st.integers(min_value=0, max_value=100)
    )
    @settings(max_examples=100)
    def test_cache_round_trip(self, lat, lon, temp, humidity):
        """
        Property 6: Weather Cache Validity
        For any cached data, retrieval within cache duration should return exact data.
        """
        service = WeatherService(api_key='test')
        cache_key = service._get_cache_key(lat, lon)
        
        test_data = {
            'current': {'temperature': temp, 'humidity': humidity},
            'forecast': []
        }
        
        # Save to cache
        service._save_to_cache(cache_key, test_data)
        
        # Retrieve immediately (within cache duration)
        retrieved = service._get_from_cache(cache_key)
        
        # Should get exact same data back
        assert retrieved is not None
        assert retrieved['current']['temperature'] == temp
        assert retrieved['current']['humidity'] == humidity
    
    def test_cache_expires_after_duration(self):
        """
        Property: Cache should be invalid after CACHE_DURATION_SECONDS.
        """
        service = WeatherService(api_key='test')
        cache_key = 'test_expiry'
        test_data = {'current': {}, 'forecast': []}
        
        # Save with old timestamp
        _weather_cache[cache_key] = {
            'timestamp': time.time() - CACHE_DURATION_SECONDS - 1,
            'data': test_data
        }
        
        # Should be invalid
        assert service._is_cache_valid(cache_key) is False
        assert service._get_from_cache(cache_key) is None
    
    def test_cache_valid_within_duration(self):
        """
        Property: Cache should be valid within CACHE_DURATION_SECONDS.
        """
        service = WeatherService(api_key='test')
        cache_key = 'test_valid'
        test_data = {'current': {}, 'forecast': []}
        
        # Save with recent timestamp
        _weather_cache[cache_key] = {
            'timestamp': time.time() - 60,  # 1 minute ago
            'data': test_data
        }
        
        # Should be valid
        assert service._is_cache_valid(cache_key) is True
        assert service._get_from_cache(cache_key) == test_data


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
