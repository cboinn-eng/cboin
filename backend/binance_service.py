from binance.client import Client
from binance.exceptions import BinanceAPIException
import logging
from typing import Dict, List
import asyncio
import os
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

logger = logging.getLogger(__name__)

class BinanceService:
    def __init__(self):
        # API anahtarlarını çevre değişkenlerinden al
        api_key = os.getenv('BINANCE_API_KEY')
        api_secret = os.getenv('BINANCE_API_SECRET')
        
        if not api_key or not api_secret:
            logger.warning("Binance API anahtarları bulunamadı!")
            api_key = ""
            api_secret = ""
        
        self.client = Client(
            api_key=api_key,
            api_secret=api_secret
        )
        
        # İzlenecek coin çiftleri
        self.pairs = [
            "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "DOGEUSDT",
            "XRPUSDT", "DOTUSDT", "SOLUSDT", "MATICUSDT", "LINKUSDT"
        ]

    async def get_all_tickers(self) -> List[Dict]:
        """Tüm coin çiftlerinin fiyat bilgilerini getir"""
        try:
            # 24 saatlik fiyat değişimlerini al
            tickers = self.client.get_ticker()
            
            # İzlenen çiftleri filtrele
            filtered_tickers = []
            for ticker in tickers:
                if ticker['symbol'] in self.pairs:
                    price_change = float(ticker['priceChangePercent'])
                    current_price = float(ticker['lastPrice'])
                    high_24h = float(ticker['highPrice'])
                    low_24h = float(ticker['lowPrice'])
                    volume = float(ticker['volume'])
                    
                    filtered_tickers.append({
                        'symbol': ticker['symbol'],
                        'price': current_price,
                        'price_change_24h': price_change,
                        'high_24h': high_24h,
                        'low_24h': low_24h,
                        'volume': volume,
                        'market_cap': volume * current_price,  # Yaklaşık piyasa değeri
                        'status': 'up' if price_change > 0 else 'down'
                    })
            
            return filtered_tickers
            
        except BinanceAPIException as e:
            logger.error(f"Binance API hatası: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Beklenmeyen hata: {str(e)}")
            return []

    async def get_coin_detail(self, symbol: str) -> Dict:
        """Belirli bir coin çifti için detaylı bilgi getir"""
        try:
            # Anlık fiyat bilgisi
            ticker = self.client.get_ticker(symbol=symbol)
            
            # Son işlemler
            trades = self.client.get_recent_trades(symbol=symbol, limit=5)
            
            # Emir defteri
            depth = self.client.get_order_book(symbol=symbol, limit=5)
            
            return {
                'symbol': symbol,
                'price': float(ticker['lastPrice']),
                'price_change_24h': float(ticker['priceChangePercent']),
                'high_24h': float(ticker['highPrice']),
                'low_24h': float(ticker['lowPrice']),
                'volume': float(ticker['volume']),
                'trades': [
                    {
                        'price': float(trade['price']),
                        'quantity': float(trade['qty']),
                        'time': trade['time']
                    } for trade in trades
                ],
                'orderbook': {
                    'bids': [
                        {
                            'price': float(bid[0]),
                            'quantity': float(bid[1])
                        } for bid in depth['bids'][:5]
                    ],
                    'asks': [
                        {
                            'price': float(ask[0]),
                            'quantity': float(ask[1])
                        } for ask in depth['asks'][:5]
                    ]
                }
            }
            
        except BinanceAPIException as e:
            logger.error(f"Binance API hatası: {str(e)}")
            return {}
        except Exception as e:
            logger.error(f"Beklenmeyen hata: {str(e)}")
            return {}

    async def get_historical_klines(self, symbol: str, interval: str, limit: int = 100) -> List[Dict]:
        """
        Get historical klines/candlestick data for a symbol
        :param symbol: Trading pair symbol (e.g., 'BTCUSDT')
        :param interval: Kline interval (e.g., '1d', '1h', '15m')
        :param limit: Number of klines to return
        :return: List of kline data
        """
        try:
            klines = self.client.get_klines(
                symbol=symbol,
                interval=interval,
                limit=limit
            )
            
            formatted_klines = []
            for k in klines:
                formatted_klines.append({
                    'timestamp': k[0],  # Open time
                    'open': float(k[1]),
                    'high': float(k[2]),
                    'low': float(k[3]),
                    'close': float(k[4]),
                    'volume': float(k[5]),
                    'close_time': k[6],
                    'quote_volume': float(k[7]),
                    'trades': k[8],
                    'taker_buy_base': float(k[9]),
                    'taker_buy_quote': float(k[10])
                })
            
            return formatted_klines
            
        except BinanceAPIException as e:
            logger.error(f"Binance API error while fetching historical data: {str(e)}")
            raise Exception(f"Failed to fetch historical data: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error while fetching historical data: {str(e)}")
            raise Exception(f"Failed to fetch historical data: {str(e)}")
