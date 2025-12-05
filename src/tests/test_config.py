"""
Tests for the configuration module.
Uses pytest with hypothesis for property-based testing.
"""

import os
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import patch

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config


class TestConfigUnit:
    """Unit tests for Config class."""
    
    def test_config_loads_from_env(self):
        """Test that Config loads values from environment variables."""
        test_env = {
            'SENTINEL_CLIENT_ID': 'test_id',
            'SENTINEL_CLIENT_SECRET': 'test_secret',
            'OPENWEATHER_API_KEY': 'test_weather_key',
            'FLASK_DEBUG': 'true'
        }
        
        with patch.dict(os.environ, test_env, clear=True):
            config = Config.load_from_env()
            
            assert config.SENTINEL_CLIENT_ID == 'test_id'
            assert config.SENTINEL_CLIENT_SECRET == 'test_secret'
            assert config.OPENWEATHER_API_KEY == 'test_weather_key'
            assert config.DEBUG is True
    
    def test_config_handles_missing_env_vars(self):
        """Test that Config handles missing environment variables gracefully."""
        with patch.dict(os.environ, {}, clear=True):
            config = Config.load_from_env()
            
            assert config.SENTINEL_CLIENT_ID is None
            assert config.SENTINEL_CLIENT_SECRET is None
            assert config.OPENWEATHER_API_KEY is None
            assert config.DEBUG is False
    
    def test_is_sentinel_configured_true(self):
        """Test is_sentinel_configured returns True when both credentials set."""
        config = Config(
            SENTINEL_CLIENT_ID='id',
            SENTINEL_CLIENT_SECRET='secret'
        )
        assert config.is_sentinel_configured() is True
    
    def test_is_sentinel_configured_false_missing_id(self):
        """Test is_sentinel_configured returns False when ID missing."""
        config = Config(SENTINEL_CLIENT_SECRET='secret')
        assert config.is_sentinel_configured() is False
    
    def test_is_sentinel_configured_false_missing_secret(self):
        """Test is_sentinel_configured returns False when secret missing."""
        config = Config(SENTINEL_CLIENT_ID='id')
        assert config.is_sentinel_configured() is False
    
    def test_is_weather_configured(self):
        """Test is_weather_configured returns correct values."""
        config_with = Config(OPENWEATHER_API_KEY='key')
        config_without = Config()
        
        assert config_with.is_weather_configured() is True
        assert config_without.is_weather_configured() is False
    
    def test_validate_returns_status(self):
        """Test validate returns correct status dictionary."""
        config = Config(
            SENTINEL_CLIENT_ID='id',
            SENTINEL_CLIENT_SECRET='secret',
            DEBUG=True
        )
        
        status = config.validate()
        
        assert status['sentinel_configured'] is True
        assert status['weather_configured'] is False
        assert status['debug_mode'] is True


class TestConfigPropertyBased:
    """
    Property-based tests for Config class.
    **Feature: geocrop-enhancements, Property 1: Environment Variable Loading**
    **Validates: Requirements 1.1**
    """
    
    @given(
        client_id=st.text(min_size=1, max_size=100),
        client_secret=st.text(min_size=1, max_size=100),
        weather_key=st.text(min_size=1, max_size=100)
    )
    @settings(max_examples=100)
    def test_env_var_round_trip(self, client_id, client_secret, weather_key):
        """
        Property 1: Environment Variable Loading
        For any set of environment variables, Config SHALL contain exact values.
        """
        test_env = {
            'SENTINEL_CLIENT_ID': client_id,
            'SENTINEL_CLIENT_SECRET': client_secret,
            'OPENWEATHER_API_KEY': weather_key
        }
        
        with patch.dict(os.environ, test_env, clear=True):
            config = Config.load_from_env()
            
            # Round-trip: env vars should be exactly preserved
            assert config.SENTINEL_CLIENT_ID == client_id
            assert config.SENTINEL_CLIENT_SECRET == client_secret
            assert config.OPENWEATHER_API_KEY == weather_key
    
    @given(debug_value=st.sampled_from(['true', 'True', 'TRUE', 'false', 'False', 'FALSE', '', 'yes', 'no']))
    @settings(max_examples=100)
    def test_debug_flag_parsing(self, debug_value):
        """
        Property: Debug flag should only be True for 'true' (case-insensitive).
        """
        with patch.dict(os.environ, {'FLASK_DEBUG': debug_value}, clear=True):
            config = Config.load_from_env()
            
            expected = debug_value.lower() == 'true'
            assert config.DEBUG == expected


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
