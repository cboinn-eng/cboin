"""Data models for the NASDAQ Market Analyzer."""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class StockData(BaseModel):
    """Model for stock data."""
    symbol: str
    name: str
    price: float
    change: float
    changePercent: float = Field(alias='change_percent')
    volume: int
    marketCap: float = Field(alias='market_cap')
    timestamp: datetime

class TechnicalIndicators(BaseModel):
    """Model for technical indicators."""
    sma_20: Optional[float]
    sma_50: Optional[float]
    rsi: Optional[float]
    volatility: float
    current_price: float

class MarketAlert(BaseModel):
    """Model for market alerts."""
    symbol: str
    name: str
    price: float
    changePercent: float = Field(alias='change_percent')
    volume: Optional[int]
    type: str
    message: str
    timestamp: datetime
    severity: str = Field(default='info')

class MarketSummary(BaseModel):
    """Model for market summary."""
    timestamp: datetime
    total_market_cap: float
    total_volume: int
    gainers_count: int
    losers_count: int
    average_change: float
    market_sentiment: str

class TradingHoursStatus(BaseModel):
    """Model for trading hours status."""
    is_open: bool
    next_open: Optional[datetime]
    current_time: datetime
    market_open: datetime
    market_close: datetime

class ErrorResponse(BaseModel):
    """Model for error responses."""
    error: str
    timestamp: datetime = Field(default_factory=datetime.now)
    code: str
