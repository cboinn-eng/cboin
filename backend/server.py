from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import logging
import asyncio
import os
import uvicorn
import json
from datetime import datetime, timedelta
import random
from typing import Dict
import aiohttp
import json
from Dashboard.Nasdaq2Marrket import NasdaqMarketAnalyzer
from aiAnalysis.aiAnalysis import AiAnalysis
from indicators.multi_coin_signals import MultiCoinAnalyzer
from fastapi import BackgroundTasks
from twitter_service import TwitterService
from binance_service import BinanceService
from auth_service import router as auth_router  # Auth router'ı import ediyoruz
from textblob import TextBlob
import signal
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, scoped_session
from sqlalchemy.orm.session import sessionmaker

# Logging ayarları
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Geliştirme ortamı
        "https://cboin-trading-bot.onrender.com",  # Production ortamı - frontend URL'nizi buraya ekleyin
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket bağlantılarını tutacak liste
websocket_connections = []

# SARIMA model instance'ı
ai_analysis = AiAnalysis()

# Twitter servisi instance'ı
twitter_service = TwitterService()

# Binance servisi instance'ı
binance_service = BinanceService()

# İndikatör servisi instance'ı
multi_coin_analyzer = MultiCoinAnalyzer()

# Auth router'ı ekle
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# Auth için Pydantic modelleri
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

# Database
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///cboin.db')
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Server başlatıldığında çalışacak fonksiyon
@app.on_event("startup")
async def startup_event():
    """Server başlatıldığında çalışacak fonksiyon"""
    logger.info("Server başlatılıyor...")
    
    try:
        # Günlük fiyat güncellemesi
        await ai_analysis.update_daily_price()
    except Exception as e:
        logger.error(f"Startup sırasında hata: {str(e)}")

async def run_indicator_analysis():
    """İndikatör analizini periyodik olarak çalıştır"""
    while True:
        try:
            # İndikatör analizini çalıştır
            signals = multi_coin_analyzer.run_analysis()
            logger.info(f"İndikatör analizi tamamlandı: {len(signals)} sinyal bulundu")
            
            # Sinyalleri JSON dosyasına kaydet
            try:
                with open('latest_signals.json', 'w') as f:
                    json.dump({
                        'signals': signals,
                        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    }, f, indent=4)
                logger.info("Sinyaller kaydedildi")
            except Exception as e:
                logger.error(f"Sinyaller kaydedilirken hata: {str(e)}")
            
            # WebSocket bağlantılarına sinyalleri gönder
            if websocket_connections:
                for connection in websocket_connections:
                    try:
                        await connection.send_json({
                            "type": "signals",
                            "data": signals
                        })
                        logger.info("Sinyaller WebSocket üzerinden gönderildi")
                    except Exception as e:
                        logger.error(f"WebSocket üzerinden sinyal gönderilirken hata: {str(e)}")
                        websocket_connections.remove(connection)
            
            # 5 dakika bekle
            await asyncio.sleep(300)
            
        except Exception as e:
            logger.error(f"İndikatör analizi sırasında hata: {str(e)}")
            # Hata durumunda 30 saniye bekle
            await asyncio.sleep(30)

@app.get("/api/signals")
async def get_signals():
    """Mevcut sinyalleri döndür"""
    try:
        # latest_signals.json dosyasını oku
        try:
            with open('latest_signals.json', 'r') as f:
                data = json.load(f)
                return data
        except FileNotFoundError:
            # Dosya yoksa yeni analiz yap
            signals = multi_coin_analyzer.run_analysis()
            data = {
                'signals': signals,
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            # Sonuçları kaydet
            with open('latest_signals.json', 'w') as f:
                json.dump(data, f, indent=4)
            return data
    except Exception as e:
        logger.error(f"Sinyaller alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Sinyaller alınamadı")

@app.websocket("/ws/market")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint'i"""
    await websocket.accept()
    connection_id = ''.join(random.choices(string.ascii_lowercase, k=5))
    logger.info(f"New WebSocket connection: {connection_id}")
    
    try:
        while True:
            try:
                # 5 saniye bekle
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error sending market data: {str(e)}")
                await asyncio.sleep(5)  # Hata durumunda da bekle
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket connection closed: {connection_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        if not websocket.client_state == WebSocketState.DISCONNECTED:
            await websocket.close()

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Trading Bot API"}

@app.get("/api/market/crypto")
async def get_crypto_data():
    """Kripto verilerini döndür"""
    try:
        analyzer = MultiCoinAnalyzer()
        data = await analyzer.get_market_data()
        
        formatted_data = {
            "data": [
                {
                    "symbol": item["symbol"],
                    "price": float(item["price"]),
                    "volume": float(item["volume"]),
                    "change_24h": float(item["price_change_percentage_24h"]),
                    "timestamp": datetime.now().isoformat()
                }
                for item in data
            ],
            "timestamp": datetime.now().isoformat()
        }
        return formatted_data
    except Exception as e:
        logger.error(f"Kripto veri hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/bist100")
async def get_bist_data():
    """BIST100 verilerini döndür"""
    try:
        # Örnek veri
        data = {
            "data": [
                {
                    "symbol": "BIST100",
                    "price": 1500,
                    "volume": 500000,
                    "change_24h": 1.5,
                    "timestamp": datetime.now().isoformat()
                }
            ],
            "timestamp": datetime.now().isoformat()
        }
        return data
    except Exception as e:
        logger.error(f"BIST100 veri hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/nasdaq")
async def get_nasdaq_data():
    """NASDAQ verilerini döndür"""
    try:
        analyzer = NasdaqMarketAnalyzer()
        price = analyzer.get_price()
        
        if price is None:
            raise HTTPException(status_code=500, detail="NASDAQ veri alınamadı")
        
        data = {
            "data": [
                {
                    "symbol": "NASDAQ",
                    "price": float(price),
                    "timestamp": datetime.now().isoformat()
                }
            ],
            "timestamp": datetime.now().isoformat()
        }
        return data
    except Exception as e:
        logger.error(f"NASDAQ veri hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/commodities")
async def get_commodity_data():
    """Emtia verilerini döndür"""
    try:
        # Örnek veri
        data = {
            "data": [
                {
                    "symbol": "ALTIN",
                    "price": 500,
                    "volume": 100000,
                    "change_24h": 1.0,
                    "timestamp": datetime.now().isoformat()
                }
            ],
            "timestamp": datetime.now().isoformat()
        }
        return data
    except Exception as e:
        logger.error(f"Emtia veri hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/signals")
async def get_market_signals():
    """Market sinyallerini döndür"""
    try:
        # Örnek sinyal verisi
        signals = {
            "signals": [
                {
                    "symbol": "BTC/USDT",
                    "signal": "buy",
                    "strength": 0.8,
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "symbol": "ETH/USDT",
                    "signal": "sell",
                    "strength": 0.6,
                    "timestamp": datetime.now().isoformat()
                }
            ],
            "timestamp": datetime.now().isoformat()
        }
        return signals
    except Exception as e:
        logger.error(f"Sinyal verisi hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/predictions")
async def get_market_predictions():
    """Market tahminlerini döndür"""
    try:
        ai_analyzer = AiAnalysis()
        predictions = ai_analyzer.get_latest_analysis()
        
        if not predictions:
            raise HTTPException(status_code=500, detail="Tahminler alınamadı")
            
        return {
            "predictions": predictions,
            "last_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    except Exception as e:
        logger.error(f"Tahmin verisi hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/analyzed-coins")
async def get_analyzed_coins():
    """Analiz edilen coinleri döndür"""
    try:
        analyzer = MultiCoinAnalyzer()
        analyzed_data = await analyzer.analyze_all_coins()
        
        if not analyzed_data:
            raise HTTPException(status_code=500, detail="Coin analizi alınamadı")
            
        formatted_data = {
            "data": [
                {
                    "symbol": coin_data["symbol"],
                    "price": float(coin_data["price"]),
                    "volume": float(coin_data["volume"]),
                    "change_24h": float(coin_data["price_change_percentage_24h"]),
                    "signals": coin_data["signals"],
                    "timestamp": datetime.now().isoformat()
                }
                for coin_data in analyzed_data
            ],
            "timestamp": datetime.now().isoformat()
        }
        return formatted_data
    except Exception as e:
        logger.error(f"Analiz verisi hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/news")
async def get_market_news():
    """Market haberlerini döndür"""
    try:
        # Örnek haber verisi
        news = {
            "articles": [
                {
                    "title": "Bitcoin Yeni ATH'ye Ulaştı",
                    "description": "Bitcoin, spot ETF onayı sonrası yeni bir rekor seviyeye ulaştı.",
                    "url": "https://example.com/news/1",
                    "publishedAt": datetime.now().isoformat(),
                    "source": "CryptoNews"
                },
                {
                    "title": "Ethereum 2.0 Güncellemesi Yaklaşıyor",
                    "description": "Ethereum ağı yeni güncelleme ile daha sürdürülebilir hale geliyor.",
                    "url": "https://example.com/news/2",
                    "publishedAt": (datetime.now() - timedelta(hours=2)).isoformat(),
                    "source": "BlockchainNews"
                }
            ],
            "timestamp": datetime.now().isoformat()
        }
        return news
    except Exception as e:
        logger.error(f"Haber verisi hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/crypto-news")
async def get_crypto_news():
    """CryptoCompare API'den kripto para haberleri çek"""
    try:
        # Endpoint çağrıldığını logla
        logger.info("Crypto news endpoint çağrıldı")
        
        api_key = os.getenv('REACT_APP_CRYPTOCOMPARE_API_KEY')
        if not api_key:
            logger.error("API key bulunamadı")
            raise ValueError("REACT_APP_CRYPTOCOMPARE_API_KEY bulunamadı")
            
        logger.info(f"API Key: {api_key[:5]}...")  # Güvenlik için sadece ilk 5 karakteri göster
            
        async with aiohttp.ClientSession() as session:
            url = f"https://min-api.cryptocompare.com/data/v2/news/?api_key={api_key}"
            
            logger.info(f"CryptoCompare API'ye istek yapılıyor: {url}")
            try:
                async with session.get(url) as response:
                    logger.info(f"API Yanıt Durumu: {response.status}")
                    
                    if response.status == 200:
                        try:
                            data = await response.json()
                            logger.info(f"API Yanıtı: {str(data)[:200]}...")  # İlk 200 karakteri göster
                            
                            if "Data" in data:
                                articles = []
                                for article in data["Data"][:10]:
                                    try:
                                        articles.append({
                                            "title": article.get("title", ""),
                                            "url": article.get("url", ""),
                                            "source": article.get("source", ""),
                                            "publishedAt": article.get("published_on", ""),
                                            "description": article.get("body", ""),
                                            "imageUrl": article.get("imageurl", "")
                                        })
                                    except Exception as e:
                                        logger.error(f"Haber verisi işlenirken hata: {str(e)}")
                                        logger.error(f"Hatalı haber verisi: {article}")
                                        continue
                                
                                logger.info(f"İşlenen haber sayısı: {len(articles)}")
                                return {"articles": articles}
                            else:
                                logger.error(f"API yanıtında 'Data' alanı bulunamadı. Yanıt: {data}")
                                raise HTTPException(
                                    status_code=500,
                                    detail="Haberler alınamadı. API yanıtı geçersiz format."
                                )
                        except json.JSONDecodeError as e:
                            error_text = await response.text()
                            logger.error(f"API yanıtı JSON formatında değil: {error_text}")
                            logger.error(f"JSON decode hatası: {str(e)}")
                            raise HTTPException(
                                status_code=500,
                                detail="API yanıtı geçersiz format"
                            )
                    else:
                        error_text = await response.text()
                        logger.error(f"CryptoCompare API hatası: {response.status}, Yanıt: {error_text}")
                        raise HTTPException(
                            status_code=response.status,
                            detail=f"API hatası oluştu: {error_text}"
                        )
            except aiohttp.ClientError as e:
                logger.error(f"API isteği yapılırken ağ hatası: {str(e)}")
                raise HTTPException(
                    status_code=503,
                    detail="API'ye bağlanılamadı"
                )
                    
    except Exception as e:
        logger.error(f"Haber verisi alınırken beklenmeyen hata: {str(e)}")
        logger.exception("Hata detayları:")
        raise HTTPException(
            status_code=500,
            detail=f"Haberler alınamadı: {str(e)}"
        )

@app.get("/api/market/nasdaq")
async def get_nasdaq_market():
    """NASDAQ market verilerini döndür"""
    try:
        nasdaq_analyzer = NasdaqMarketAnalyzer()
        data = nasdaq_analyzer.get_market_data()
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"NASDAQ verileri alınırken hata: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"NASDAQ verileri alınamadı: {str(e)}"
        )

@app.get("/api/live-price")
async def get_live_price(background_tasks: BackgroundTasks):
    background_tasks.add_task(fetch_live_price)
    return {"status": "Fetching live price..."}

async def fetch_live_price():
    # Here you would call the function in Nasdaq2Marrket.py that retrieves live price data
    pass

@app.get("/api/predictions")  # Changed from /ai/predictions
async def get_predictions():
    """En son Bitcoin tahminlerini döndür"""
    try:
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'aiAnalysis', 'bitcoin_predictions.json'), 'r') as f:
            predictions = json.load(f)
        return {"predictions": predictions}  # Wrapped in predictions key
    except Exception as e:
        logger.error(f"Tahminler alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Tahminler alınamadı")

@app.get("/ai/predictions/update")
async def update_predictions():
    """Tahminleri güncelle"""
    try:
        await ai_analysis.update_daily_price()
        await ai_analysis.update_predictions()
        return {"message": "Tahminler güncellendi"}
    except Exception as e:
        logger.error(f"Tahminler güncellenirken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Tahminler güncellenemedi")

@app.get("/market/emtia")
async def get_emtia():
    """Emtia verilerini döndür"""
    try:
        # Örnek veri
        return {
            "gold": {"price": 2050.25, "change": 0.5},
            "silver": {"price": 23.15, "change": -0.2},
            "platinum": {"price": 915.80, "change": 0.3},
            "palladium": {"price": 950.40, "change": -0.1},
            "oil": {"price": 76.50, "change": 1.2}
        }
    except Exception as e:
        logger.error(f"Emtia verileri alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Emtia verileri alınamadı")

@app.get("/market/nasdaq")
async def get_nasdaq():
    """NASDAQ verilerini döndür"""
    try:
        # Örnek veri
        return {
            "AAPL": {"price": 185.85, "change": 1.2},
            "MSFT": {"price": 415.25, "change": 0.8},
            "GOOGL": {"price": 142.65, "change": -0.5},
            "AMZN": {"price": 168.45, "change": 0.3},
            "NVDA": {"price": 721.30, "change": 2.1}
        }
    except Exception as e:
        logger.error(f"NASDAQ verileri alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="NASDAQ verileri alınamadı")

@app.get("/market/signals")
async def get_signals():
    """Market sinyallerini döndür"""
    try:
        # Örnek veri
        return {
            "signals": [
                {
                    "symbol": "BTC/USDT",
                    "signal": "STRONG_BUY",
                    "price": 48250.25,
                    "timestamp": datetime.now().isoformat(),
                    "indicators": {
                        "rsi": 65,
                        "macd": "BULLISH",
                        "ma": "ABOVE"
                    }
                },
                {
                    "symbol": "ETH/USDT",
                    "signal": "BUY",
                    "price": 2485.75,
                    "timestamp": datetime.now().isoformat(),
                    "indicators": {
                        "rsi": 58,
                        "macd": "BULLISH",
                        "ma": "ABOVE"
                    }
                }
            ]
        }
    except Exception as e:
        logger.error(f"Market sinyalleri alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Market sinyalleri alınamadı")

@app.get("/market/analyzed-coins")
async def get_analyzed_coins():
    """Analiz edilen coinleri döndür"""
    try:
        # Örnek veri
        return {
            "coins": [
                {
                    "symbol": "BTC/USDT",
                    "price": 48250.25,
                    "change_24h": 2.5,
                    "volume": 28500000000,
                    "market_cap": 950000000000,
                    "analysis": {
                        "trend": "BULLISH",
                        "strength": 8,
                        "support": 47500,
                        "resistance": 49000
                    }
                },
                {
                    "symbol": "ETH/USDT",
                    "price": 2485.75,
                    "change_24h": 1.8,
                    "volume": 15200000000,
                    "market_cap": 285000000000,
                    "analysis": {
                        "trend": "BULLISH",
                        "strength": 7,
                        "support": 2400,
                        "resistance": 2550
                    }
                }
            ]
        }
    except Exception as e:
        logger.error(f"Analiz edilen coinler alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Analiz edilen coinler alınamadı")

@app.get("/market/crypto-news")
async def get_crypto_news():
    """Kripto para haberlerini döndür"""
    try:
        # Örnek veri
        return {
            "news": [
                {
                    "title": "Bitcoin Reaches New Heights",
                    "source": "CryptoNews",
                    "url": "https://example.com/news/1",
                    "timestamp": datetime.now().isoformat(),
                    "summary": "Bitcoin continues its bullish trend..."
                },
                {
                    "title": "Ethereum Updates Coming Soon",
                    "source": "CoinDesk",
                    "url": "https://example.com/news/2",
                    "timestamp": datetime.now().isoformat(),
                    "summary": "Ethereum developers announce..."
                }
            ]
        }
    except Exception as e:
        logger.error(f"Kripto haberleri alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Kripto haberleri alınamadı")

@app.get("/api/market/portfolio-coins")
async def get_portfolio_coins():
    """Portföydeki coinlerin detaylı analizini döndür"""
    try:
        return {
            "categories": [
                {
                    "name": "DeFi",
                    "coins": [
                        {
                            "symbol": "BNB",
                            "name": "Binance Coin",
                            "category": "DeFi",
                            "price": 325.75,
                            "change_24h": 2.8,
                            "position": {
                                "amount": 10.5,
                                "avg_price": 280.50,
                                "profit_loss": 15.2
                            },
                            "analysis": {
                                "trend": "BULLISH",
                                "strength": 8,
                                "target_price": 400.00,
                                "stop_loss": 290.00,
                                "key_metrics": {
                                    "market_dominance": "High",
                                    "ecosystem_growth": "Strong",
                                    "development_activity": "Very High"
                                },
                                "highlights": [
                                    "1 saniyeden az blok kesinliği",
                                    "Günlük 100M işlem hedefi",
                                    "Gazsız işlemler",
                                    "AI entegrasyonu",
                                    "Akıllı cüzdan"
                                ]
                            }
                        }
                    ]
                },
                {
                    "name": "DeSci",
                    "coins": [
                        {
                            "symbol": "ATOM",
                            "name": "Cosmos",
                            "category": "DeSci",
                            "price": 8.25,
                            "change_24h": 1.5,
                            "position": {
                                "amount": 100,
                                "avg_price": 7.50,
                                "profit_loss": 10.0
                            },
                            "analysis": {
                                "trend": "NEUTRAL",
                                "strength": 6,
                                "target_price": 12.00,
                                "stop_loss": 7.00,
                                "key_metrics": {
                                    "market_dominance": "Medium",
                                    "ecosystem_growth": "Strong",
                                    "development_activity": "High"
                                }
                            }
                        }
                    ]
                },
                {
                    "name": "DePIN",
                    "coins": [
                        {
                            "symbol": "FIL",
                            "name": "Filecoin",
                            "category": "DePIN",
                            "price": 5.85,
                            "change_24h": -1.2,
                            "position": {
                                "amount": 500,
                                "avg_price": 5.20,
                                "profit_loss": 12.5
                            },
                            "analysis": {
                                "trend": "BULLISH",
                                "strength": 7,
                                "target_price": 8.00,
                                "stop_loss": 5.00,
                                "key_metrics": {
                                    "market_dominance": "High",
                                    "ecosystem_growth": "Very Strong",
                                    "development_activity": "High"
                                }
                            }
                        }
                    ]
                },
                {
                    "name": "RWA",
                    "description": "Real World Assets",
                    "coins": [
                        {
                            "symbol": "MKR",
                            "name": "Maker",
                            "category": "RWA",
                            "price": 1850.25,
                            "change_24h": 3.2,
                            "position": {
                                "amount": 2.5,
                                "avg_price": 1750.00,
                                "profit_loss": 5.7
                            },
                            "analysis": {
                                "trend": "BULLISH",
                                "strength": 9,
                                "target_price": 2500.00,
                                "stop_loss": 1600.00,
                                "key_metrics": {
                                    "market_dominance": "High",
                                    "ecosystem_growth": "Strong",
                                    "development_activity": "Very High"
                                }
                            }
                        }
                    ]
                }
            ],
            "portfolio_summary": {
                "total_value": 158750.25,
                "total_profit_loss": 12.5,
                "risk_level": "Moderate",
                "diversification_score": 8.5
            }
        }
    except Exception as e:
        logger.error(f"Portföy coin analizi alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Portföy coin analizi alınamadı")

@app.post("/api/register")
async def register(user: UserRegister):
    try:
        success, message = auth_service.register_user(
            user.username,
            user.password,
            user.email
        )
        if success:
            return {"message": message}
        raise HTTPException(status_code=400, detail=message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/login")
async def login(user: UserLogin):
    try:
        if auth_service.authenticate_user(user.username, user.password):
            return {
                "message": "Login successful",
                "username": user.username
            }
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user")
async def get_user(username: str):
    """Kullanıcı bilgilerini döndür"""
    try:
        user = auth_service.get_user_by_username(username)
        if user:
            return {"username": user.username, "email": user.email}
        return {"message": "Kullanıcı bulunamadı"}, 404
    except Exception as e:
        logger.error(f"Kullanıcı bilgileri alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Kullanıcı bilgileri alınamadı")

# Sarıma modeli endpoint'leri
@app.post("/model/sarima")
async def start_sarima_model(request: dict):
    try:
        coin = request.get('coin')
        if not coin:
            raise HTTPException(status_code=400, detail="coin parametresi gerekli")
            
        # Burada sarıma modelini başlatacak kodlar gelecek
        # Şimdilik sadece başarılı yanıt döndürelim
        return {"message": f"Sarıma modeli {coin} için başlatıldı"}
    except Exception as e:
        logger.error(f"Sarıma modeli başlatılırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Sarıma modeli başlatılamadı")

@app.post("/model/stop")
async def stop_model():
    try:
        # Burada modeli durduracak kodlar gelecek
        # Şimdilik sadece başarılı yanıt döndürelim
        return {"message": "Model durduruldu"}
    except Exception as e:
        logger.error(f"Model durdurulurken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Model durdurulamadı")

@app.get("/social/twitter/recent-tweets/{username}")
async def get_recent_tweets(username: str):
    """Kullanıcının son tweetlerini döndür"""
    try:
        logger.info(f"Twitter endpoint çağrıldı: {username}")
        tweets = await twitter_service.get_recent_tweets(username)
        logger.info(f"Dönen tweet sayısı: {len(tweets)}")
        return {"tweets": tweets}
    except Exception as e:
        logger.error(f"Twitter verileri alınırken hata: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Twitter verileri alınamadı: {str(e)}")

@app.get("/market/coins")
async def get_coin_prices():
    """Tüm coinlerin fiyat bilgilerini döndür"""
    try:
        coins = await binance_service.get_all_tickers()
        return {"coins": coins}
    except Exception as e:
        logger.error(f"Coin fiyatları alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Coin fiyatları alınamadı")

@app.get("/market/coins/{symbol}")
async def get_coin_detail(symbol: str):
    """Belirli bir coinin detaylı bilgilerini döndür"""
    try:
        coin_detail = await binance_service.get_coin_detail(symbol)
        if not coin_detail:
            raise HTTPException(status_code=404, detail="Coin bulunamadı")
        return coin_detail
    except Exception as e:
        logger.error(f"Coin detayı alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Coin detayı alınamadı")

@app.get("/api/news")
async def get_news():
    """CryptoCompare'den haberleri getir"""
    try:
        url = f"https://min-api.cryptocompare.com/data/v2/news/?lang=EN&api_key={os.getenv('CRYPTOCOMPARE_API_KEY', '')}"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                data = await response.json()
                if 'Data' in data:
                    return {"Data": data['Data']}  
                return {"Data": []}
    except Exception as e:
        logger.error(f"Haber alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/stats")
async def get_market_stats():
    """Piyasa istatistiklerini getir"""
    try:
        url = f"https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC&tsyms=USD&api_key={os.getenv('CRYPTOCOMPARE_API_KEY')}"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                data = await response.json()
                btc_data = data['RAW']['BTC']['USD']
                
                return {
                    "currentPrice": btc_data['PRICE'],
                    "priceChange": btc_data['CHANGEPCT24HOUR'],
                    "volume24h": btc_data['VOLUME24HOUR'],
                    "marketCap": btc_data['MKTCAP'],
                    "btcDominance": btc_data['SUPPLY'] / btc_data['MKTCAP'] * 100
                }
    except Exception as e:
        logger.error(f"Piyasa istatistikleri alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/price/history")
async def get_price_history(symbol: str = "BTCUSDT", interval: str = "1d", limit: int = 100):
    """
    Get historical price data for a given symbol
    :param symbol: Trading pair symbol (default: BTCUSDT)
    :param interval: Kline/Candlestick interval (default: 1d)
    :param limit: Number of data points to return (default: 100)
    :return: List of historical price data
    """
    try:
        historical_data = await binance_service.get_historical_klines(symbol, interval, limit)
        # Transform data to match frontend expectation
        formatted_data = []
        for item in historical_data:
            formatted_data.append({
                "date": item["timestamp"],
                "price": item["close"],
                "volume": item["volume"]
            })
        return formatted_data  # Return direct array as expected by frontend
    except Exception as e:
        logger.error(f"Error fetching historical price data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/twitter/analiz")
async def get_twitter_analysis():
    """Twitter analizlerini getir"""
    try:
        # Twitter API bağlantısı
        auth = tweepy.OAuthHandler(
            os.getenv('TWITTER_API_KEY'),
            os.getenv('TWITTER_API_SECRET')
        )
        auth.set_access_token(
            os.getenv('TWITTER_ACCESS_TOKEN'),
            os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
        )
        api = tweepy.API(auth)

        # Son tweetleri al
        tweets = api.user_timeline(
            screen_name="ivy_cboinn",
            count=5,
            tweet_mode="extended",
            include_entities=True
        )

        # Tweet verilerini işle
        processed_tweets = []
        for tweet in tweets:
            tweet_data = {
                "id": tweet.id,
                "text": tweet.full_text,
                "created_at": tweet.created_at.isoformat(),
                "favorite_count": tweet.favorite_count,
                "retweet_count": tweet.retweet_count,
                "username": tweet.user.name,
                "screen_name": tweet.user.screen_name,
                "profile_image_url": tweet.user.profile_image_url_https,
            }

            # Medya varsa ekle
            if hasattr(tweet, 'extended_entities') and 'media' in tweet.extended_entities:
                media = tweet.extended_entities['media'][0]
                if media['type'] == 'photo':
                    tweet_data['media_url'] = media['media_url_https']

            # Duygu analizi yap
            blob = TextBlob(tweet.full_text)
            sentiment_score = blob.sentiment.polarity
            
            if sentiment_score > 0:
                tweet_data['sentiment'] = 'positive'
            elif sentiment_score < 0:
                tweet_data['sentiment'] = 'negative'
            else:
                tweet_data['sentiment'] = 'neutral'

            processed_tweets.append(tweet_data)

        return processed_tweets

    except Exception as e:
        logger.error(f"Twitter analizi alınırken hata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    def signal_handler(sig, frame):
        print("\n=== Trading Bot Server kapatılıyor... ===\n")
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("\n=== Trading Bot Server başlatılıyor... ===\n")
    
    # Render.com için PORT değişkenini kullan, varsayılan olarak 10000
    port = int(os.getenv("PORT", 10000))
    
    # Host'u 0.0.0.0 olarak ayarla ve workers sayısını sınırla
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        workers=1,  # Worker sayısını sınırla
        limit_max_requests=1000  # Maksimum istek sayısını sınırla
    )