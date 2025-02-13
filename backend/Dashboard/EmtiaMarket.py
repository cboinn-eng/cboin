import json
import aiohttp
import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Optional
from selenium import webdriver

# Logging ayarları
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmtiaMarketAnalyzer:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://financialmodelingprep.com/api/v3/quote"
        
        # İzlenecek emtia sembolleri
        self.symbols = [
            "ZOUSX",  # Yulaf
            "ZCSX",   # Mısır
            "ZWSX",   # Buğday
            "ZRSX",   # Pirinç
            "ZSSX",   # Soya Fasulyesi
            "GCUSD",  # Altın
            "SIUSD",  # Gümüş
            "PLUSD",  # Platin
            "CLUSD",  # Ham Petrol
            "NGUSD"   # Doğal Gaz
        ]

    async def get_emtia_data(self, symbol: str) -> Optional[Dict]:
        """Belirli bir emtia için veri çek"""
        try:
            url = f"{self.base_url}/{symbol}?apikey={self.api_key}"
            logger.info(f"Emtia verisi alınıyor: {symbol}")
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data and len(data) > 0:
                            item = data[0]
                            return {
                                "symbol": item["symbol"],
                                "name": item["name"],
                                "price": item["price"],
                                "change": item["change"],
                                "changePercent": item["changesPercentage"],
                                "dayLow": item["dayLow"],
                                "dayHigh": item["dayHigh"],
                                "volume": item["volume"],
                                "timestamp": item["timestamp"]
                            }
                        else:
                            logger.warning(f"Emtia verisi boş: {symbol}")
                            return None
                    else:
                        logger.error(f"Emtia verisi alınamadı: {symbol}, Status: {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"Emtia verisi alınırken hata ({symbol}): {str(e)}")
            return None

    async def get_all_emtia_data(self) -> List[Dict]:
        """Tüm emtialar için veri çek"""
        try:
            tasks = []
            for symbol in self.symbols:
                tasks.append(self.get_emtia_data(symbol))
            
            results = await asyncio.gather(*tasks)
            
            # None olmayan sonuçları filtrele
            emtia_data = [data for data in results if data is not None]
            
            if not emtia_data:
                logger.error("Hiçbir emtia verisi alınamadı")
                return []
                
            return emtia_data
            
        except Exception as e:
            logger.error(f"Emtia verileri alınırken hata: {str(e)}")
            return []

async def main():
    """Test fonksiyonu"""
    try:
        api_key = "EeCzp3KmtjxN9I0ZBbLrwIsDQljf24cz"
        analyzer = EmtiaMarketAnalyzer(api_key)
        
        # Tüm emtia verilerini al
        emtia_data = await analyzer.get_all_emtia_data()
        
        # Sonuçları yazdır
        print(json.dumps(emtia_data, indent=2))
        
    except Exception as e:
        logger.error(f"Test sırasında hata: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
