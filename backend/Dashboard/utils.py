"""Utility functions for the NASDAQ Market Analyzer."""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import statistics

def calculate_technical_indicators(price_history: List[Dict]) -> Dict:
    """
    Calculate technical indicators from price history.
    
    Args:
        price_history (List[Dict]): List of historical price data
        
    Returns:
        Dict: Dictionary containing calculated indicators
    """
    if not price_history:
        return {}
        
    prices = [float(item['price']) for item in price_history]
    
    # Calculate basic indicators
    sma_20 = statistics.mean(prices[-20:]) if len(prices) >= 20 else None
    sma_50 = statistics.mean(prices[-50:]) if len(prices) >= 50 else None
    
    # Calculate RSI
    def calculate_rsi(prices: List[float], periods: int = 14) -> Optional[float]:
        if len(prices) < periods + 1:
            return None
            
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]
        
        avg_gain = statistics.mean(gains[:periods])
        avg_loss = statistics.mean(losses[:periods])
        
        if avg_loss == 0:
            return 100
            
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return round(rsi, 2)
    
    rsi = calculate_rsi(prices)
    
    # Calculate volatility
    volatility = statistics.stdev(prices) if len(prices) > 1 else 0
    
    return {
        'sma_20': round(sma_20, 2) if sma_20 else None,
        'sma_50': round(sma_50, 2) if sma_50 else None,
        'rsi': rsi,
        'volatility': round(volatility, 2),
        'current_price': prices[-1]
    }

def generate_market_summary(stock_data: List[Dict]) -> Dict:
    """
    Generate a market summary from stock data.
    
    Args:
        stock_data (List[Dict]): List of stock data
        
    Returns:
        Dict: Market summary statistics
    """
    if not stock_data:
        return {}
        
    total_market_cap = sum(float(stock.get('marketCap', 0)) for stock in stock_data)
    total_volume = sum(float(stock.get('volume', 0)) for stock in stock_data)
    
    # Calculate market performance
    gainers = [stock for stock in stock_data if float(stock.get('changePercent', 0)) > 0]
    losers = [stock for stock in stock_data if float(stock.get('changePercent', 0)) < 0]
    
    avg_change = statistics.mean([float(stock.get('changePercent', 0)) for stock in stock_data])
    
    return {
        'timestamp': datetime.now().isoformat(),
        'total_market_cap': round(total_market_cap, 2),
        'total_volume': total_volume,
        'gainers_count': len(gainers),
        'losers_count': len(losers),
        'average_change': round(avg_change, 2),
        'market_sentiment': 'Bullish' if avg_change > 0 else 'Bearish'
    }

def format_currency(value: float) -> str:
    """
    Format a number as currency with appropriate suffixes (K, M, B, T).
    
    Args:
        value (float): Number to format
        
    Returns:
        str: Formatted currency string
    """
    suffixes = ['', 'K', 'M', 'B', 'T']
    magnitude = 0
    
    while abs(value) >= 1000 and magnitude < len(suffixes) - 1:
        value /= 1000
        magnitude += 1
    
    return f"${value:.2f}{suffixes[magnitude]}"

def get_trading_hours_status() -> Dict:
    """
    Check if the market is currently open based on US trading hours.
    
    Returns:
        Dict: Market hours status information
    """
    now = datetime.now()
    market_open = datetime.now().replace(hour=9, minute=30, second=0, microsecond=0)
    market_close = datetime.now().replace(hour=16, minute=0, second=0, microsecond=0)
    
    is_weekday = now.weekday() < 5
    is_market_hours = market_open <= now <= market_close
    
    next_open = market_open
    if not is_market_hours:
        if now > market_close:
            next_open += timedelta(days=1)
        while next_open.weekday() >= 5:
            next_open += timedelta(days=1)
    
    return {
        'is_open': is_weekday and is_market_hours,
        'next_open': next_open.isoformat() if not (is_weekday and is_market_hours) else None,
        'current_time': now.isoformat(),
        'market_open': market_open.isoformat(),
        'market_close': market_close.isoformat()
    }
