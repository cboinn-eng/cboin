import pandas as pd
import numpy as np
from binance.client import Client
import json
import logging
from datetime import datetime, timedelta
import time
import schedule
import pandas_ta as ta
import sys
import os

# Logging ayarları
logging.basicConfig(
    filename='signals.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class MultiCoinAnalyzer:
    def __init__(self):
        # Test modunda başlat
        self.client = Client("", "", testnet=True)  # Binance API
        
        # Zaman dilimleri
        self.timeframes = {
            "2h": "2h",
            "4h": "4h",
            "1d": "1d"
        }
        
        # İndikatör parametreleri
        self.rsi_length = 21
        self.stochastic_length = 21
        self.stochastic_k = 6
        self.upper_limit = 80
        self.lower_limit = 40
        self.atr_length = 10
        self.macd_fast = 26
        self.macd_slow = 48
        self.macd_signal = 9

    def get_top_coins(self):
        """Binance'den top coinleri alır"""
        try:
            # Binance'den 24 saatlik ticker bilgisini al
            tickers = self.client.get_ticker()
            
            # Sadece USDT çiftlerini al ve hacme göre sırala
            usdt_pairs = [t for t in tickers if t['symbol'].endswith('USDT')]
            usdt_pairs.sort(key=lambda x: float(x['quoteVolume']), reverse=True)
            
            # İlk 50 coini al
            top_coins = [pair['symbol'].replace('USDT', '') for pair in usdt_pairs[:50]]
            print(f"Top coinler alındı: {', '.join(top_coins[:5])}... (+{len(top_coins)-5} coin)")
            
            return top_coins
        except Exception as e:
            logging.error(f"Top coinler alınırken hata: {str(e)}")
            return []

    def get_historical_data(self, symbol, interval="1h", lookback="100"):
        """Binance'den geçmiş fiyat verilerini alır"""
        try:
            print(f"Veri alınıyor: {symbol} ({interval})")
            
            # API çağrısı yap
            try:
                klines = self.client.get_klines(
                    symbol=f"{symbol}USDT",
                    interval=interval,
                    limit=int(lookback)
                )
            except Exception as e:
                error_msg = f"Binance API hatası ({symbol}, {interval}): {str(e)}"
                print(f"  HATA: {error_msg}")
                logging.error(error_msg)
                return None
            
            # Veri kontrolü
            if not klines:
                error_msg = f"Veri alınamadı: {symbol} ({interval})"
                print(f"  HATA: {error_msg}")
                logging.error(error_msg)
                return None
            
            # DataFrame oluştur
            try:
                df = pd.DataFrame(klines, columns=[
                    'timestamp', 'open', 'high', 'low', 'close', 'volume',
                    'close_time', 'quote_asset_volume', 'number_of_trades',
                    'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
                ])
                
                # Veri tiplerini dönüştür
                df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                df['close'] = df['close'].astype(float)
                df['high'] = df['high'].astype(float)
                df['low'] = df['low'].astype(float)
                df['open'] = df['open'].astype(float)
                
                print(f"  Veri alındı: {len(df)} satır")
                return df
                
            except Exception as e:
                error_msg = f"DataFrame oluşturulurken hata ({symbol}, {interval}): {str(e)}"
                print(f"  HATA: {error_msg}")
                logging.error(error_msg)
                return None
                
        except Exception as e:
            error_msg = f"Veri alınırken hata ({symbol}, {interval}): {str(e)}"
            print(f"  HATA: {error_msg}")
            logging.error(error_msg)
            return None

    def calculate_indicators(self, df):
        """Teknik indikatörleri hesaplar"""
        try:
            if df is None or df.empty:
                logging.error("DataFrame boş veya None")
                return None
                
            print("  İndikatörler hesaplanıyor...")
            
            # RSI
            try:
                df['rsi'] = ta.rsi(df['close'], length=self.rsi_length)
                print("    - RSI hesaplandı")
            except Exception as e:
                logging.error(f"RSI hesaplanırken hata: {str(e)}")
                return None
            
            # Stochastic
            try:
                df['stoch'] = ta.sma(
                    ta.stoch(
                        df['high'],
                        df['low'],
                        df['close'],
                        k=self.stochastic_k,
                        d=self.stochastic_length
                    )['STOCHk_14_3_3'],
                    length=3
                )
                print("    - Stochastic hesaplandı")
            except Exception as e:
                logging.error(f"Stochastic hesaplanırken hata: {str(e)}")
                return None
            
            # MACD
            try:
                macd = ta.macd(
                    df['close'],
                    fast=self.macd_fast,
                    slow=self.macd_slow,
                    signal=self.macd_signal
                )
                df['macd'] = macd['MACD_26_48_9']
                df['macd_signal'] = macd['MACDs_26_48_9']
                df['macd_hist'] = macd['MACDh_26_48_9']
                print("    - MACD hesaplandı")
            except Exception as e:
                logging.error(f"MACD hesaplanırken hata: {str(e)}")
                return None
            
            # ATR
            try:
                df['atr'] = ta.atr(
                    df['high'],
                    df['low'],
                    df['close'],
                    length=self.atr_length
                )
                print("    - ATR hesaplandı")
            except Exception as e:
                logging.error(f"ATR hesaplanırken hata: {str(e)}")
                return None
            
            # Bollinger Bands
            try:
                bb = ta.bbands(df['close'], length=20)
                df['bb_upper'] = bb['BBU_20_2.0']
                df['bb_middle'] = bb['BBM_20_2.0']
                df['bb_lower'] = bb['BBL_20_2.0']
                print("    - Bollinger Bands hesaplandı")
            except Exception as e:
                logging.error(f"Bollinger Bands hesaplanırken hata: {str(e)}")
                return None
            
            # EMA'lar
            try:
                df['ema_50'] = ta.ema(df['close'], length=50)
                df['ema_100'] = ta.ema(df['close'], length=100)
                df['ema_200'] = ta.ema(df['close'], length=200)
                print("    - EMA'lar hesaplandı")
            except Exception as e:
                logging.error(f"EMA'lar hesaplanırken hata: {str(e)}")
                return None
            
            print("  İndikatörler başarıyla hesaplandı")
            return df
            
        except Exception as e:
            error_msg = f"İndikatörler hesaplanırken hata: {str(e)}"
            print(f"  HATA: {error_msg}")
            logging.error(error_msg)
            return None

    def analyze_signals(self, df, symbol):
        """Sinyalleri analiz eder"""
        try:
            signals = []
            last_row = df.iloc[-1]
            
            # RSI Sinyalleri
            if last_row['rsi'] < self.lower_limit:
                signals.append({
                    'symbol': symbol,
                    'indicator': 'RSI',
                    'signal': 'Aşırı Satım',
                    'value': round(last_row['rsi'], 2),
                    'strength': 'Güçlü'
                })
            elif last_row['rsi'] > self.upper_limit:
                signals.append({
                    'symbol': symbol,
                    'indicator': 'RSI',
                    'signal': 'Aşırı Alım',
                    'value': round(last_row['rsi'], 2),
                    'strength': 'Güçlü'
                })
            
            # Stochastic Sinyalleri
            if last_row['stoch'] < self.lower_limit:
                signals.append({
                    'symbol': symbol,
                    'indicator': 'Stochastic',
                    'signal': 'Aşırı Satım',
                    'value': round(last_row['stoch'], 2),
                    'strength': 'Orta'
                })
            elif last_row['stoch'] > self.upper_limit:
                signals.append({
                    'symbol': symbol,
                    'indicator': 'Stochastic',
                    'signal': 'Aşırı Alım',
                    'value': round(last_row['stoch'], 2),
                    'strength': 'Orta'
                })
            
            # MACD Sinyalleri
            if last_row['macd'] > last_row['macd_signal'] and df.iloc[-2]['macd'] <= df.iloc[-2]['macd_signal']:
                signals.append({
                    'symbol': symbol,
                    'indicator': 'MACD',
                    'signal': 'Al',
                    'value': round(last_row['macd'], 2),
                    'strength': 'Güçlü'
                })
            elif last_row['macd'] < last_row['macd_signal'] and df.iloc[-2]['macd'] >= df.iloc[-2]['macd_signal']:
                signals.append({
                    'symbol': symbol,
                    'indicator': 'MACD',
                    'signal': 'Sat',
                    'value': round(last_row['macd'], 2),
                    'strength': 'Güçlü'
                })
            
            # Bollinger Band Sinyalleri
            if last_row['close'] < last_row['bb_lower']:
                signals.append({
                    'symbol': symbol,
                    'indicator': 'Bollinger',
                    'signal': 'Alt Bant Kırıldı',
                    'value': round(last_row['close'], 2),
                    'strength': 'Güçlü'
                })
            elif last_row['close'] > last_row['bb_upper']:
                signals.append({
                    'symbol': symbol,
                    'indicator': 'Bollinger',
                    'signal': 'Üst Bant Kırıldı',
                    'value': round(last_row['close'], 2),
                    'strength': 'Güçlü'
                })
            
            # EMA Sinyalleri
            if last_row['ema_50'] > last_row['ema_200'] and df.iloc[-2]['ema_50'] <= df.iloc[-2]['ema_200']:
                signals.append({
                    'symbol': symbol,
                    'indicator': 'EMA',
                    'signal': 'Altın Çapraz',
                    'value': round(last_row['close'], 2),
                    'strength': 'Çok Güçlü'
                })
            elif last_row['ema_50'] < last_row['ema_200'] and df.iloc[-2]['ema_50'] >= df.iloc[-2]['ema_200']:
                signals.append({
                    'symbol': symbol,
                    'indicator': 'EMA',
                    'signal': 'Ölüm Çaprazı',
                    'value': round(last_row['close'], 2),
                    'strength': 'Çok Güçlü'
                })
            
            return signals
            
        except Exception as e:
            logging.error(f"Sinyaller analiz edilirken hata: {str(e)}")
            return []

    def run_analysis(self):
        """Tüm analiz sürecini çalıştırır"""
        try:
            all_signals = []
            print("\nCoin analizi başlatılıyor...")
            logging.info("Coin analizi başlatılıyor")
            
            # 1. Top coinleri al
            print("Top coinler alınıyor...")
            coins = self.get_top_coins()
            if not coins:
                error_msg = "Coin listesi boş! Binance API'den veri alınamadı."
                print(error_msg)
                logging.error(error_msg)
                return []
            
            print(f"Top coinler alındı: {len(coins)} coin bulundu")
            logging.info(f"Top coinler alındı: {len(coins)} coin bulundu")
            
            # 2. Her coin için analiz yap
            for coin in coins:
                try:
                    print(f"\n{coin} analiz ediliyor...")
                    logging.info(f"{coin} analiz ediliyor")
                    
                    for timeframe in self.timeframes.values():
                        print(f"- {timeframe} timeframe analiz ediliyor")
                        df = self.get_historical_data(coin, timeframe)
                        
                        if df is not None and not df.empty:
                            df = self.calculate_indicators(df)
                            if df is not None and not df.empty:
                                signals = self.analyze_signals(df, f"{coin}-{timeframe}")
                                if signals:
                                    all_signals.extend(signals)
                                    print(f"  {len(signals)} sinyal bulundu")
                                    logging.info(f"{coin}-{timeframe} için {len(signals)} sinyal bulundu")
                            else:
                                print(f"  İndikatörler hesaplanamadı")
                                logging.warning(f"{coin}-{timeframe} için indikatörler hesaplanamadı")
                        else:
                            print(f"  Fiyat verisi alınamadı")
                            logging.warning(f"{coin}-{timeframe} için fiyat verisi alınamadı")
                            
                except Exception as e:
                    error_msg = f"{coin} analiz edilirken hata: {str(e)}"
                    print(f"  HATA: {error_msg}")
                    logging.error(error_msg)
                    continue
            
            # 3. Sinyalleri önem sırasına göre sırala
            if all_signals:
                all_signals.sort(key=lambda x: {
                    'Çok Güçlü': 3,
                    'Güçlü': 2,
                    'Orta': 1
                }[x['strength']], reverse=True)
                
                print(f"\nToplam {len(all_signals)} sinyal bulundu")
                logging.info(f"Toplam {len(all_signals)} sinyal bulundu")
            else:
                print("\nHiç sinyal bulunamadı")
                logging.warning("Hiç sinyal bulunamadı")
            
            return all_signals
            
        except Exception as e:
            error_msg = f"Analiz çalıştırılırken hata: {str(e)}"
            print(f"\nHATA: {error_msg}")
            logging.error(error_msg)
            return []

    def save_signals(self, signals):
        """Sinyal sonuçlarını kaydeder"""
        try:
            formatted_signals = []
            for signal in signals:
                # NaN ve inf değerleri kontrol et
                def clean_float(value):
                    if isinstance(value, float):
                        if np.isnan(value) or np.isinf(value):
                            return 0.0
                        return float(round(value, 8))  # 8 decimal ile sınırla
                    return value

                formatted_signal = {
                    'symbol': signal['symbol'],
                    'indicator': signal['indicator'],
                    'signal': signal['signal'],
                    'value': clean_float(signal['value']),
                    'strength': signal['strength']
                }
                formatted_signals.append(formatted_signal)
            
            # Sonuçları JSON dosyasına kaydet
            output = {
                'signals': formatted_signals,
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'latest_signals.json')
            with open(file_path, 'w') as f:
                json.dump(output, f, indent=4)
                
            logging.info(f"{len(formatted_signals)} sinyal kaydedildi")
            
        except Exception as e:
            logging.error(f"Sinyaller kaydedilirken hata: {str(e)}")

def run_analysis():
    """Ana analiz fonksiyonu"""
    try:
        total_start_time = time.time()
        print("\nCoin analizi başlatılıyor...")
        analyzer = MultiCoinAnalyzer()
        
        # 1. Top coinleri alma süresi
        coin_start_time = time.time()
        print("Top coinler alınıyor...")
        coins = analyzer.get_top_coins()
        coin_duration = time.time() - coin_start_time
        print(f"Top coinler alındı: {len(coins)} coin bulundu (Süre: {coin_duration:.2f} saniye)")
        
        if not coins:
            print("Coin listesi boş!")
            return
            
        # 2. Analiz süresi
        print("\nCoinler analiz ediliyor...")
        analysis_start_time = time.time()
        signals = analyzer.run_analysis()
        analysis_duration = time.time() - analysis_start_time
        
        if signals:
            print(f"\n{len(signals)} adet sinyal bulundu:")
            for signal in signals:
                print(f"- {signal['symbol']}: {signal['indicator']} - {signal['signal']} ({signal['strength']})")
        else:
            print("\nAktif sinyal bulunamadı")
        
        # 3. Kaydetme süresi
        save_start_time = time.time()
        analyzer.save_signals(signals)
        save_duration = time.time() - save_start_time
        
        # Toplam süre
        total_duration = time.time() - total_start_time
        minutes = int(total_duration // 60)
        seconds = int(total_duration % 60)
        
        print("\nPerformans Özeti:")
        print(f"- Top coin listesi alma: {coin_duration:.2f} saniye")
        print(f"- Coin analizi: {analysis_duration:.2f} saniye")
        print(f"- Sonuçları kaydetme: {save_duration:.2f} saniye")
        print(f"- Toplam süre: {minutes} dakika {seconds} saniye")
        print(f"- Coin başına ortalama süre: {(analysis_duration/len(coins)):.2f} saniye")
        
        # Frontend için önerilen timeout değeri (toplam sürenin 1.5 katı)
        suggested_timeout = int(total_duration * 1.5)
        print(f"\nFrontend için önerilen timeout değeri: {suggested_timeout} saniye")
        
    except Exception as e:
        error_msg = f"Analiz sırasında hata: {str(e)}"
        print(error_msg)
        logging.error(error_msg)

def main():
    """Ana program döngüsü"""
    try:
        print("Multi-Coin Sinyal Tarayıcı başlatılıyor...")
        logging.info("Multi-Coin Sinyal Tarayıcı başlatılıyor...")
        
        # İlk çalıştırma
        print("İlk analiz başlatılıyor...")
        run_analysis()
        print("İlk analiz tamamlandı. Sonuçlar latest_signals.json dosyasında.")
        
        # Her 5 dakikada bir çalıştır
        schedule.every(5).minutes.do(run_analysis)
        print("Program her 5 dakikada bir otomatik tarama yapacak şekilde ayarlandı.")
        
        while True:
            try:
                schedule.run_pending()
                time.sleep(30)  # 30 saniye bekle (daha sık kontrol)
            except KeyboardInterrupt:
                print("\nProgram kullanıcı tarafından durduruldu")
                logging.info("Program kullanıcı tarafından durduruldu")
                break
            except Exception as e:
                error_msg = f"Beklenmeyen hata: {str(e)}"
                print(error_msg)
                logging.error(error_msg)
                time.sleep(5)  # Hata durumunda 5 saniye bekle
                continue

    except Exception as e:
        error_msg = f"Program başlatılırken hata: {str(e)}"
        print(error_msg)
        logging.error(error_msg)

if __name__ == "__main__":
    main()
