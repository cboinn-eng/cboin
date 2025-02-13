from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json
import logging
import os

# Logging ayarları
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NasdaqMarketAnalyzer:
    def __init__(self):
        self.options = Options()
        self.options.add_argument('--headless')
        self.options.add_argument('--no-sandbox')
        self.options.add_argument('--disable-dev-shm-usage')
        self.options.add_argument('--disable-gpu')
        self.options.add_argument('--remote-debugging-port=9222')
        self.options.binary_location = os.getenv('CHROME_BIN', '/usr/bin/google-chrome')
        
        service = Service(executable_path=os.getenv('CHROME_DRIVER', '/usr/bin/chromedriver'))
        self.driver = webdriver.Chrome(service=service, options=self.options)
        self.is_running = False
        logger.info("NasdaqMarketAnalyzer initialized")

    def stop_driver(self):
        if self.driver:
            try:
                self.driver.quit()
                self.driver = None
                logger.info("WebDriver stopped successfully")
            except Exception as e:
                logger.error(f"Error stopping WebDriver: {str(e)}")

    def get_price(self):
        try:
            self.driver.get("https://tr.tradingview.com/chart/KU6okxb3/")
            self.driver.implicitly_wait(10)
            
            price = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, '//*[@id="quote-header-info"]/div[2]/div[1]/div[1]/span[1]'))
            ).text
            
            logger.info(f"Retrieved price: {price}")
            return price
        except Exception as e:
            logger.error(f"Error getting price: {str(e)}")
            return None

    def start_monitoring(self):
        self.is_running = True
        
        while self.is_running:
            try:
                price = self.get_price()
                if price:
                    print(price)
                time.sleep(3)
            except KeyboardInterrupt:
                logger.info("Monitoring stopped by user")
                self.stop_monitoring()
            except Exception as e:
                logger.error(f"Error during monitoring: {str(e)}")
                time.sleep(3)

    def stop_monitoring(self):
        self.is_running = False
        self.stop_driver()

if __name__ == "__main__":
    analyzer = NasdaqMarketAnalyzer()
    analyzer.start_monitoring()