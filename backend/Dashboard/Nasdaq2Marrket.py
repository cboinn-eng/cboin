from selenium import webdriver
from selenium.webdriver.common.by import By
from time import sleep
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import logging

# Logging ayarları
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NasdaqMarketAnalyzer:
    def __init__(self):
        self.driver = None
        self.is_running = False
        logger.info("NasdaqMarketAnalyzer initialized")

    def start_driver(self):
        if self.driver is None:
            try:
                chrome_options = webdriver.ChromeOptions()
                chrome_options.add_argument("--incognito")
                chrome_options.add_argument("--headless")
                self.driver = webdriver.Chrome(options=chrome_options)
                self.driver.delete_all_cookies()
                logger.info("WebDriver started successfully")
            except Exception as e:
                logger.error(f"Error starting WebDriver: {str(e)}")
                raise

    def stop_driver(self):
        if self.driver:
            try:
                self.driver.quit()
                self.driver = None
                logger.info("WebDriver stopped successfully")
            except Exception as e:
                logger.error(f"Error stopping WebDriver: {str(e)}")

    def get_price(self):
        if not self.driver:
            self.start_driver()
        
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
        self.start_driver()
        
        while self.is_running:
            try:
                price = self.get_price()
                if price:
                    print(price)
                sleep(3)
            except KeyboardInterrupt:
                logger.info("Monitoring stopped by user")
                self.stop_monitoring()
            except Exception as e:
                logger.error(f"Error during monitoring: {str(e)}")
                sleep(3)

    def stop_monitoring(self):
        self.is_running = False
        self.stop_driver()

if __name__ == "__main__":
    analyzer = NasdaqMarketAnalyzer()
    analyzer.start_monitoring()