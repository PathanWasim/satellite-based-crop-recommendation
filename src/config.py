"""
Configuration module for GeoCrop Predictor.
Loads environment variables and provides configuration management.
"""

import os
from dataclasses import dataclass
from typing import Optional
import logging

# Try to load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, use system env vars

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class Config:
    """Configuration class for application settings."""
    
    # Sentinel Hub API credentials
    SENTINEL_CLIENT_ID: Optional[str] = None
    SENTINEL_CLIENT_SECRET: Optional[str] = None
    
    # OpenWeatherMap API key
    OPENWEATHER_API_KEY: Optional[str] = None
    
    # Flask settings
    DEBUG: bool = False
    
    @classmethod
    def load_from_env(cls) -> 'Config':
        """
        Load configuration from environment variables.
        
        Returns:
            Config: Configuration object with values from environment
        """
        config = cls(
            SENTINEL_CLIENT_ID=os.environ.get('SENTINEL_CLIENT_ID'),
            SENTINEL_CLIENT_SECRET=os.environ.get('SENTINEL_CLIENT_SECRET'),
            OPENWEATHER_API_KEY=os.environ.get('OPENWEATHER_API_KEY'),
            DEBUG=os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
        )
        
        # Log warnings for missing credentials
        if not config.is_sentinel_configured():
            logger.warning(
                "Sentinel Hub credentials not configured. "
                "Set SENTINEL_CLIENT_ID and SENTINEL_CLIENT_SECRET environment variables. "
                "Falling back to local EuroSAT images."
            )
        
        if not config.is_weather_configured():
            logger.warning(
                "OpenWeatherMap API key not configured. "
                "Set OPENWEATHER_API_KEY environment variable. "
                "Weather features will be disabled."
            )
        
        return config
    
    def is_sentinel_configured(self) -> bool:
        """Check if Sentinel Hub credentials are configured."""
        return bool(self.SENTINEL_CLIENT_ID and self.SENTINEL_CLIENT_SECRET)
    
    def is_weather_configured(self) -> bool:
        """Check if OpenWeatherMap API key is configured."""
        return bool(self.OPENWEATHER_API_KEY)
    
    def validate(self) -> dict:
        """
        Validate configuration and return status.
        
        Returns:
            dict: Validation status for each service
        """
        return {
            'sentinel_configured': self.is_sentinel_configured(),
            'weather_configured': self.is_weather_configured(),
            'debug_mode': self.DEBUG
        }


# Global configuration instance
config = Config.load_from_env()
