import requests
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ping_server():
    url = "https://cboin-trading-bot.onrender.com"  # Kendi URL'nizi buraya yazın
    try:
        response = requests.get(url)
        logger.info(f"Ping status: {response.status_code}")
    except Exception as e:
        logger.error(f"Ping failed: {str(e)}")

def main():
    while True:
        ping_server()
        time.sleep(840)  # 14 dakika (15 dakikadan önce ping at)

if __name__ == "__main__":
    main()
