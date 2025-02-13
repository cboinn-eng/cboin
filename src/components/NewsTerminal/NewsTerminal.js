import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Typography, Spin, Divider } from 'antd';
import axios from 'axios';
import CryptoNews from './CryptoNews';
import './NewsTerminal.css';

const { Text } = Typography;

const NewsTerminal = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  const RSS_FEEDS = useMemo(() => [
    { url: 'https://www.ntv.com.tr/ekonomi.rss', source: 'NTV Ekonomi' },
    { url: 'https://www.ntv.com.tr/teknoloji.rss', source: 'NTV Teknoloji' },
    { url: 'http://www.hurriyet.com.tr/rss/ekonomi', source: 'Hürriyet Ekonomi' },
    { url: 'http://www.hurriyet.com.tr/rss/teknoloji', source: 'Hürriyet Teknoloji' },
    { url: 'http://www.milliyet.com.tr/rss/rssNew/dunyaRss.xml', source: 'Milliyet Dünya' },
    { url: 'http://www.milliyet.com.tr/rss/rssNew/ekonomiRss.xml', source: 'Milliyet Ekonomi' },
    { url: 'http://www.milliyet.com.tr/rss/rssNew/teknolojiRss.xml', source: 'Milliyet Teknoloji' },
    { url: 'https://www.sabah.com.tr/rss/ekonomi.xml', source: 'Sabah Ekonomi' },
    { url: 'https://www.sabah.com.tr/rss/teknoloji.xml', source: 'Sabah Teknoloji' },
    { url: 'https://www.takvim.com.tr/rss/ekonomi.xml', source: 'Takvim Ekonomi' },
    { url: 'https://www.cnnturk.com/feed/rss/all/news', source: 'CNN Türk Tümü' },
    { url: 'https://www.cnnturk.com/feed/rss/turkiye/news', source: 'CNN Türk Türkiye' },
    { url: 'https://www.cnnturk.com/feed/rss/dunya/news', source: 'CNN Türk Dünya' },
    { url: 'https://www.cnnturk.com/feed/rss/bilim-teknoloji/news', source: 'CNN Türk Teknoloji' },
    { url: 'https://www.cnnturk.com/feed/rss/ekonomi/news', source: 'CNN Türk Ekonomi' },
    { url: 'http://www.finansgundem.com/rss', source: 'Finans Gündem' },
    { url: 'https://www.tobb.org.tr/Sayfalar/RssFeeder.php?List=DuyurularListesi', source: 'TOBB Duyurular' },
    { url: 'https://www.tobb.org.tr/Sayfalar/RssFeeder.php?List=Haberler', source: 'TOBB Haberler' },
    { url: 'https://www.tobb.org.tr/Sayfalar/RssFeeder.php?List=MansetListesi', source: 'TOBB Manşet' },
    { url: 'http://bigpara.hurriyet.com.tr/rss/', source: 'BigPara' },
    { url: 'http://www.ekoseyir.com/rss/piyasalar/248.xml', source: 'Ekoseyir Piyasalar' }
  ], []);

  const extractImageFromDescription = useCallback((description) => {
    if (!description) return null;
    const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
    return imgMatch ? imgMatch[1] : null;
  }, []);

  const fetchRSSFeed = useCallback(async () => {
    try {
      const randomFeed = RSS_FEEDS[Math.floor(Math.random() * RSS_FEEDS.length)];
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      
      const response = await axios.get(`${proxyUrl}${encodeURIComponent(randomFeed.url)}`);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, 'text/xml');
      const items = xmlDoc.querySelectorAll('item');
      
      const newItems = Array.from(items).slice(0, 5).map(item => ({
        title: item.querySelector('title')?.textContent || '',
        link: item.querySelector('link')?.textContent || '',
        pubDate: new Date(item.querySelector('pubDate')?.textContent || ''),
        source: randomFeed.source,
        description: item.querySelector('description')?.textContent || '',
        image: item.querySelector('enclosure')?.getAttribute('url') || 
               item.querySelector('media\\:content')?.getAttribute('url') || 
               extractImageFromDescription(item.querySelector('description')?.textContent) ||
               '/default-news-image.png'
      }));

      setNews(prevNews => {
        const combinedNews = [...prevNews, ...newItems];
        return combinedNews
          .sort((a, b) => b.pubDate - a.pubDate)
          .slice(0, 5);
      });
      setLoading(false);
    } catch (error) {
      console.error('RSS beslemesi çekilirken hata oluştu:', error);
      setLoading(false);
    }
  }, [extractImageFromDescription, RSS_FEEDS]);

  useEffect(() => {
    fetchRSSFeed();
    const interval = setInterval(fetchRSSFeed, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRSSFeed]);

  useEffect(() => {
    if (news.length > 0) {
      const rotateInterval = setInterval(() => {
        setCurrentNewsIndex((prevIndex) => (prevIndex + 1) % news.length);
      }, 5000);
      return () => clearInterval(rotateInterval);
    }
  }, [news]);

  const currentNews = news[currentNewsIndex];

  return (
    <div className="news-container">
      <Card className="news-section" title="Kripto Para Haberleri">
        <CryptoNews />
      </Card>

      <Divider className="news-divider" />

      <Card className="news-terminal-card" title="Ekonomi Haberleri">
        {loading && news.length === 0 ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : (
          <div className="news-rotator">
            {currentNews && (
              <a href={currentNews.link} target="_blank" rel="noopener noreferrer" className="news-item-rotator">
                <div className="news-image">
                  <img src={currentNews.image} alt={currentNews.title} onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-news-image.png';
                  }} />
                </div>
                <div className="news-content">
                  <Text className="news-title">{currentNews.title}</Text>
                  <div className="news-meta">
                    <Text type="secondary">{currentNews.source}</Text>
                    <Text type="secondary">
                      {currentNews.pubDate.toLocaleDateString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </div>
                </div>
              </a>
            )}
            <div className="news-indicators">
              {news.map((_, index) => (
                <span
                  key={index}
                  className={`indicator ${index === currentNewsIndex ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NewsTerminal;