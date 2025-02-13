import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os
import logging
import warnings
import schedule
import time
from binance.client import Client
from statsmodels.tsa.statespace.sarimax import SARIMAX
import traceback
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
from pmdarima import auto_arima  # Hiperparametre optimizasyonu için
import matplotlib.pyplot as plt  # Grafik oluşturmak için
import io
import base64  # Grafiği base64 formatına dönüştürmek için
from dotenv import load_dotenv  # .env dosyasından değişkenleri yüklemek için

warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

# Get API keys from environment variables
BINANCE_API_KEY = os.getenv('BINANCE_API_KEY')
BINANCE_API_SECRET = os.getenv('BINANCE_API_SECRET')

# Dosya yolları
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(CURRENT_DIR, 'logs')
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# Dosya yolları
SARIMA_FILE = os.path.join(CURRENT_DIR, 'bitcoin_sarima.csv')
PREDICTIONS_FILE = os.path.join(CURRENT_DIR, 'bitcoin_predictions.json')
PREDICTIONS_CSV = os.path.join(CURRENT_DIR, 'bitcoin_predictions.csv')

# Logging ayarları
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(LOG_DIR, 'ai_analysis.log'))
    ]
)

class AiAnalysis:
    def __init__(self):
        logging.info("AI Analyzer başlatıldı")
        self.client = None
        self.model = None
        self.latest_predictions = None
        self.is_training = False
        
        # Binance client'ı başlat
        try:
            self.client = Client(BINANCE_API_KEY, BINANCE_API_SECRET)
        except Exception as e:
            logging.error(f"Binance client başlatılamadı: {str(e)}")
    
    async def train_model(self, max_iter=10):
        """SARIMA modelini eğit"""
        if self.is_training:
            return
            
        self.is_training = True
        try:
            # Bitcoin verilerini al
            df = self.get_historical_data()
            if df is None or df.empty:
                logging.error("Veri alınamadı")
                return
                
            logging.info("SARIMA model eğitimi başlatılıyor")
            print(f"* Toplam {len(df)} günlük veri okundu")
            print(f"* Veri aralığı: {df.index[0].strftime('%Y-%m-%d')} - {df.index[-1].strftime('%Y-%m-%d')}")
            
            # Veriyi train ve test olarak ayır
            train_size = int(len(df) * 0.8)
            train = df[:train_size]
            
            print("* Hiperparametre optimizasyonu yapılıyor...")
            
            # Auto ARIMA ile hiperparametre optimizasyonu
            model = auto_arima(
                train,
                start_p=0, start_q=0,
                max_p=2, max_q=2,  # p ve q değerlerini sınırla
                m=7,  # Haftalık sezonsellik
                seasonal=True,
                d=1, D=0,  # Differencing parametreleri
                trace=True,
                error_action='ignore',
                suppress_warnings=True,
                stepwise=True,
                max_order=4,  # Toplam parametre sayısını sınırla
                maxiter=max_iter,  # İterasyon sayısını sınırla
                n_fits=10  # Deneme sayısını sınırla
            )
            
            self.model = model
            
            # Tahminleri güncelle
            self.update_predictions(df)
            
        except Exception as e:
            logging.error(f"Model eğitimi sırasında hata: {str(e)}")
            traceback.print_exc()
        finally:
            self.is_training = False
    
    def update_predictions(self, df):
        """Tahminleri güncelle"""
        try:
            if self.model is None:
                return
                
            # Son 30 günün tahminini yap
            forecast = self.model.predict(n_periods=30)
            
            # Tahminleri kaydet
            predictions = []
            last_date = df.index[-1]
            
            for i, pred in enumerate(forecast):
                date = last_date + timedelta(days=i+1)
                predictions.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'price': float(pred)
                })
            
            # Tahminleri dosyaya kaydet
            with open(PREDICTIONS_FILE, 'w') as f:
                json.dump(predictions, f)
                
            self.latest_predictions = predictions
            
        except Exception as e:
            logging.error(f"Tahmin güncellenirken hata: {str(e)}")
    
    def get_historical_data(self):
        """Tarihsel Bitcoin verilerini al"""
        try:
            if self.client is None:
                return None
                
            # Son 2 yıllık veriyi al (bellek kullanımını azaltmak için)
            klines = self.client.get_historical_klines(
                "BTCUSDT",
                Client.KLINE_INTERVAL_1DAY,
                "2 years ago UTC"
            )
            
            if not klines:
                return None
                
            # DataFrame oluştur
            df = pd.DataFrame(klines, columns=[
                'timestamp', 'open', 'high', 'low', 'close',
                'volume', 'close_time', 'quote_asset_volume',
                'number_of_trades', 'taker_buy_base_asset_volume',
                'taker_buy_quote_asset_volume', 'ignore'
            ])
            
            # Sadece kapanış fiyatını al
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            df.set_index('timestamp', inplace=True)
            df = df['close'].astype(float)
            
            return df
            
        except Exception as e:
            logging.error(f"Tarihsel veri alınırken hata: {str(e)}")
            return None

    async def analyze(self):
        """Bitcoin fiyat tahminlerini analiz eder"""
        try:
            print("\nAI analizi başlatılıyor...")
            
            # Güncel fiyatı al ve kaydet
            date, price = await self.get_bitcoin_price()
            if date and price:
                if await self.save_price_to_csv(date, price):
                    print(f"* Yeni fiyat kaydedildi: {date}, ${price:,.2f}")
                    
                    # SARIMA modelini eğit
                    await self.train_model()
                    
                    # Tahminleri kaydet
                    await self.make_predictions()
                    
                    return True
            return False
        except Exception as e:
            logging.error(f"AI analizi sırasında hata: {str(e)}")
            return False

    async def get_latest_analysis(self):
        """En son tahminleri döndür"""
        try:
            # Tahmin dosyasını kontrol et
            if not os.path.exists(PREDICTIONS_FILE):
                # Tahmin dosyası yoksa, yeni tahminler yap
                data = pd.read_csv(SARIMA_FILE)
                model = await self.train_model()
                if model:
                    await self.make_predictions(model, data)
                else:
                    return None
            
            # Tahminleri oku
            with open(PREDICTIONS_FILE, 'r') as f:
                predictions = json.load(f)
            
            # Tahminleri formatla
            formatted_predictions = []
            for date, pred in predictions.items():
                formatted_predictions.append({
                    "date": date,
                    "prediction": float(pred["predicted_price"]),
                    "confidence": float(pred["confidence_score"]),
                    "symbol": "BTC/USDT"
                })
            
            # Tarihe göre sırala
            formatted_predictions.sort(key=lambda x: x["date"])
            
            return formatted_predictions
        except Exception as e:
            logging.error(f"Tahminler alınırken hata: {str(e)}")
            return None

    async def get_bitcoin_price(self):
        """Binance'den Bitcoin kapanış fiyatını alır"""
        try:
            client = Client(BINANCE_API_KEY, BINANCE_API_SECRET)
            # Son günün kapanış fiyatını al
            klines = client.get_historical_klines("BTCUSDT", Client.KLINE_INTERVAL_1DAY, "1 day ago UTC")
            if klines:
                close_price = float(klines[0][4])  # Kapanış fiyatı
                date = datetime.fromtimestamp(klines[0][0] / 1000).strftime('%Y-%m-%d')
                return date, close_price
            return None, None
        except Exception as e:
            logging.error(f"Bitcoin fiyatı alınırken hata: {str(e)}")
            return None, None

    async def save_price_to_csv(self, date, price):
        """Bitcoin fiyatını CSV'nin 2. satırına kaydeder"""
        try:
            # Mevcut CSV'yi oku
            rows = []
            try:
                with open(SARIMA_FILE, 'r', encoding='utf-8') as f:
                    rows = f.readlines()
            except FileNotFoundError:
                rows = ["Tarih,Kapanış\n"]
        
            # Yeni veriyi 2. satıra ekle
            new_row = f"{date},{price}\n"
            if len(rows) < 2:
                rows.append(new_row)
            else:
                rows.insert(1, new_row)
        
            # CSV'yi güncelle
            with open(SARIMA_FILE, 'w', encoding='utf-8') as f:
                f.writelines(rows)
            
            logging.info(f"Fiyat 2. satıra kaydedildi: {date}, {price}")
            return True
        except Exception as e:
            logging.error(f"Fiyat kaydedilirken hata: {str(e)}")
            return False

    async def make_predictions(self):
        try:
            # Model eğitimi
            logging.info("SARIMA model eğitimi başlatılıyor")
            print("=== SARIMA Model Eğitimi Başlatılıyor ===")
            
            # Veri hazırlığı
            data = self.read_price_data()
            print(f"* Toplam {len(data)} günlük veri okundu")
            print(f"* Veri aralığı: {data.index[0].strftime('%Y-%m-%d')} - {data.index[-1].strftime('%Y-%m-%d')}")
            
            # Hiperparametre optimizasyonu
            print("* Hiperparametre optimizasyonu yapılıyor...")
            model = auto_arima(data['price'],
                             seasonal=True,
                             m=7,
                             start_p=0, start_q=0,
                             max_p=3, max_q=3,
                             start_P=0, start_Q=0,
                             max_P=2, max_Q=2,
                             d=1, D=0,
                             trace=True,
                             error_action='ignore',
                             suppress_warnings=True,
                             stepwise=True)
            
            print("* Model eğitimi tamamlandı")
            print(f"* En iyi model parametreleri: {model.order}, {model.seasonal_order}")
            
            # 90 günlük tahmin
            n_periods = 90
            forecast, conf_int = model.predict(n_periods=n_periods, return_conf_int=True)
            
            # Tahmin sonuçlarını DataFrame'e dönüştür
            last_date = data.index[-1]
            forecast_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=n_periods)
            forecast_df = pd.DataFrame({
                'price': forecast,
                'lower_bound': conf_int[:, 0],
                'upper_bound': conf_int[:, 1]
            }, index=forecast_dates)
            
            # Tahminleri kaydet
            self.save_predictions(forecast_df)
            return True
            
        except Exception as e:
            logging.error(f"Tahmin sırasında hata: {str(e)}")
            print(f"Tahmin sırasında hata: {str(e)}")
            traceback.print_exc()
            return False

    def read_price_data(self):
        try:
            df = pd.read_csv(SARIMA_FILE)
            df['Tarih'] = pd.to_datetime(df['Tarih'])
            df = df.sort_values('Tarih')
            df = df.set_index('Tarih')  # Tarihi index olarak ayarla
            data = df['Kapanış'].astype(float)
            return pd.DataFrame({'price': data})
        except Exception as e:
            logging.error(f"Fiyat verileri okunurken hata: {str(e)}")
            return None

    def save_predictions(self, forecast_df):
        try:
            # Save to CSV (eski tahminler silinip yeni tahminler yazılacak)
            forecast_df.to_csv(PREDICTIONS_CSV, index=True)

            # Save to JSON (eski tahminler silinip yeni tahminler yazılacak)
            results = {
                'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'predictions': [],
                'model_info': {
                    'type': 'SARIMA-based prediction',
                    'trend': 'Annual 100% growth assumption', 
                    'seasonality': 'Weekly cycle with ±1% effect',
                    'confidence_interval': '95%',
                    'prediction_days': 90
                }
            }

            for index, row in forecast_df.iterrows():
                results['predictions'].append({
                    'date': index.strftime('%Y-%m-%d'),
                    'price': row['price'],
                    'lower_bound': row['lower_bound'],
                    'upper_bound': row['upper_bound']
                })

            with open(PREDICTIONS_FILE, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=4, ensure_ascii=False)

            print(f"* Tahminler kaydedildi: {len(results['predictions'])} tahmin")
            logging.info(f"Tahminler kaydedildi: {len(results['predictions'])} tahmin")
            return True
        except Exception as e:
            logging.error(f"Tahminler kaydedilirken hata: {str(e)}")
            return False

app = FastAPI()

class AnalysisRequest(BaseModel):
    text: str

@app.post("/analyze")
async def analyze(request: AnalysisRequest):
    try:
        # Your analysis logic here
        result = {"analysis": "Sample analysis result"}
        return result
    except Exception as e:
        logging.error(f"Error in analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ai/predictions")
async def get_predictions():
    """API endpoint for getting predictions"""
    try:
        ai = AiAnalysis()
        predictions = ai.get_latest_analysis()
        return predictions
    except Exception as e:
        logging.error(f"Predictions endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ai/predictions/plot")
async def get_predictions_plot():
    """Tahminleri grafik olarak döner"""
    try:
        ai = AiAnalysis()
        predictions = ai.get_latest_analysis()
        
        # Tahmin verilerini al
        dates = [pred['date'] for pred in predictions]
        pred_values = [pred['prediction'] for pred in predictions]
        lower_bounds = [pred['lower_bound'] for pred in predictions]
        upper_bounds = [pred['upper_bound'] for pred in predictions]
        
        # Grafik oluştur
        plt.figure(figsize=(12, 6))
        plt.plot(dates, pred_values, label='Tahmin Edilen Fiyat', color='blue')
        plt.fill_between(dates, lower_bounds, upper_bounds, color='lightblue', alpha=0.3, label='Güven Aralığı')
        plt.xlabel('Tarih')
        plt.ylabel('Fiyat (USD)')
        plt.title('Bitcoin Fiyat Tahminleri ve Güven Aralığı')
        plt.legend()
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # Grafiği base64 formatına dönüştür
        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        plt.close()
        
        # Base64 formatında grafiği döndür
        return {"plot": base64.b64encode(img.getvalue()).decode('utf-8')}
    except Exception as e:
        logging.error(f"Grafik oluşturma sırasında hata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("Starting SARIMA model server...")
    print("API endpoints:")
    print("- GET /ai/predictions - Get latest predictions")
    print("- GET /ai/predictions/plot - Get predictions plot")
    
    # Initialize scheduler
    ai = AiAnalysis()
    asyncio.run(ai.train_model())
    
    # Run FastAPI app
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)