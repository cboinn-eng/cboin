import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Typography, Space, Tooltip, Image, message } from 'antd';
import { GlobalOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { ENDPOINTS } from '../../config/api';
import './CryptoNews.css';

const { Text, Link } = Typography;

const CryptoNews = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Test API çağrısı
    const testApiCall = async () => {
        try {
            const response = await axios.get('https://min-api.cryptocompare.com/data/v2/news/?api_key=' + process.env.REACT_APP_CRYPTOCOMPARE_API_KEY);
            console.log('Doğrudan API yanıtı:', response.data);
        } catch (error) {
            console.error('Doğrudan API çağrısı hatası:', error);
        }
    };

    const fetchCryptoNews = async () => {
        try {
            setLoading(true);
            console.log('Backend API çağrısı yapılıyor:', ENDPOINTS.MARKET.NEWS);
            
            // Önce doğrudan API'yi test et
            await testApiCall();
            
            const response = await axios.get(ENDPOINTS.MARKET.NEWS);
            console.log('Backend API Yanıtı:', response.data);
            
            if (response.data && response.data.articles) {
                setNews(response.data.articles);
                setError(null);
            } else {
                console.error('Geçersiz API yanıtı:', response.data);
                setError('Haber verisi formatı geçersiz');
            }
        } catch (error) {
            console.error('Kripto haberleri yüklenirken hata:', error);
            console.error('Hata detayları:', error.response?.data);
            setError(error.response?.data?.detail || 'Haberler alınamadı. Lütfen daha sonra tekrar deneyin.');
            message.error('Haberler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCryptoNews();
        const interval = setInterval(fetchCryptoNews, 300000); // Her 5 dakikada bir güncelle
        return () => clearInterval(interval);
    }, []);

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const published = new Date(timestamp * 1000); // Unix timestamp'i tarihe çevir
        const diffInMinutes = Math.floor((now - published) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes} dakika önce`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} saat önce`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `${days} gün önce`;
        }
    };

    return (
        <Card
            className="crypto-news-card"
            title={
                <Space>
                    <GlobalOutlined />
                    <span>Kripto Haberleri</span>
                </Space>
            }
        >
            {error ? (
                <div className="error-message">{error}</div>
            ) : (
                <List
                    loading={loading}
                    dataSource={news}
                    renderItem={item => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={
                                    item.imageUrl && (
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            width={100}
                                            height={60}
                                            style={{ objectFit: 'cover' }}
                                            fallback="data:image/png;base64,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"
                                        />
                                    )
                                }
                                title={
                                    <Link href={item.url} target="_blank">
                                        {item.title}
                                    </Link>
                                }
                                description={
                                    <>
                                        <div className="news-description">{item.description}</div>
                                        <Space style={{ marginTop: 8 }}>
                                            <Tag color="blue">{item.source}</Tag>
                                            <Tooltip title={new Date(item.publishedAt * 1000).toLocaleString('tr-TR')}>
                                                <Space>
                                                    <ClockCircleOutlined />
                                                    <Text type="secondary">{getTimeAgo(item.publishedAt)}</Text>
                                                </Space>
                                            </Tooltip>
                                        </Space>
                                    </>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </Card>
    );
};

export default CryptoNews;
