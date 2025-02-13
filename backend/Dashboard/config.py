"""Configuration settings for the NASDAQ Market Analyzer."""

import os

# API Configuration
API_KEY = os.getenv("EMTIA_API_KEY", "EeCzp3KmtjxN9I0ZBbLrwIsDQljf24cz")
BASE_URL = "https://financialmodelingprep.com/api/v3/quote"

# Watched Symbols Configuration
WATCHED_SYMBOLS = [
    "AAPL",   # Apple
    "MSFT",   # Microsoft
    "GOOGL",  # Alphabet (Google)
    "AMZN",   # Amazon
    "META",   # Meta (Facebook)
    "TSLA",   # Tesla
    "NVDA",   # NVIDIA
    "NFLX",   # Netflix
    "INTC",   # Intel
    "AMD"     # AMD
]

# Logging Configuration
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_LEVEL = 'INFO'

# Alert Configuration
VOLUME_THRESHOLD = 1000000  # Average volume threshold for alerts
PRICE_CHANGE_THRESHOLD = 2.0  # Percentage threshold for price change alerts

# Technical Analysis Configuration
SMA_PERIODS = {
    'short': 20,
    'medium': 50,
    'long': 200
}

RSI_PERIOD = 14
RSI_OVERBOUGHT = 70
RSI_OVERSOLD = 30

# Cache Configuration
CACHE_EXPIRY = 60  # seconds
MAX_PRICE_HISTORY = 50  # maximum number of price points to store

# API Rate Limiting
RATE_LIMIT = {
    'requests_per_minute': 30,
    'burst_limit': 5
}

# Market Hours Configuration
MARKET_HOURS = {
    'open': {
        'hour': 9,
        'minute': 30
    },
    'close': {
        'hour': 16,
        'minute': 0
    },
    'timezone': 'America/New_York'
}

# Error Messages
ERROR_MESSAGES = {
    'api_error': 'Failed to fetch data from the API',
    'symbol_not_found': 'Stock symbol not found',
    'invalid_data': 'Invalid or missing data in response',
    'rate_limit': 'Rate limit exceeded',
}
