from typing import List, Dict
import tweepy
import logging
import json

# Detaylı loglama ayarları
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TwitterService:
    def __init__(self):
        # Twitter API v2 credentials
        self.api_key = "2QbYBxSKRNuOmwHPEGxGnYQPi"
        self.api_secret = "aBXZxkUqMDfOlzNBtZIxF2qjmJmYXrxSEv5FIbYlIRCrWVLEEy"
        self.access_token = "1747932258453893120-vqknInJajGvrI8EJOUMi5r56WzvzJE"
        self.access_token_secret = "nbI6RWbBqi4N8Rqu51QcDLEgYC9BW8RobfsihujKOBzX6"
        self.bearer_token = "AAAAAAAAAAAAAAAAAAAAAEyVzAEAAAAAj5QHhp6MNovqjv679NH9u91uMks%3DfBc5q9lW4v6FOQTBAF1El1t6J7hIfZ7MnxH12jdMBOdUPnUcw6"
        
        try:
            # Initialize Twitter API v2 client
            self.client = tweepy.Client(
                bearer_token=self.bearer_token,
                consumer_key=self.api_key,
                consumer_secret=self.api_secret,
                access_token=self.access_token,
                access_token_secret=self.access_token_secret,
                wait_on_rate_limit=True
            )
            logger.info("Twitter API v2 client başarıyla başlatıldı")
        except Exception as e:
            logger.error(f"Twitter API v2 client başlatılırken hata: {str(e)}")
            raise

    async def get_recent_tweets(self, username: str, count: int = 5) -> List[Dict]:
        """Belirtilen kullanıcının son tweetlerini getirir"""
        try:
            logger.info(f"'{username}' için tweetler alınıyor...")
            
            # Kullanıcı ID'sini al
            user = self.client.get_user(username=username)
            if not user.data:
                logger.error(f"Kullanıcı bulunamadı: {username}")
                return []

            user_id = user.data.id
            logger.info(f"Kullanıcı bulundu: {username} (ID: {user_id})")

            # Kullanıcının son tweetlerini al
            tweets = self.client.get_users_tweets(
                id=user_id,
                max_results=count,
                exclude=['retweets', 'replies'],
                tweet_fields=['created_at', 'public_metrics']
            )
            
            if not tweets.data:
                logger.warning(f"Tweet bulunamadı: {username}")
                return []
                
            logger.info(f"{len(tweets.data)} tweet bulundu")
            
            formatted_tweets = []
            for tweet in tweets.data:
                tweet_data = {
                    'id': tweet.id,
                    'text': tweet.text,
                    'created_at': tweet.created_at.isoformat() if tweet.created_at else None,
                    'metrics': tweet.public_metrics
                }
                formatted_tweets.append(tweet_data)
                logger.info(f"Tweet formatlandı: {json.dumps(tweet_data, indent=2)}")
            
            return formatted_tweets
            
        except Exception as e:
            logger.error(f"Twitter verileri alınırken hata: {str(e)}", exc_info=True)
            return []
