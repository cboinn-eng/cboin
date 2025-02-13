import React from 'react';
import { Card, List, Typography, Space } from 'antd';
import { GlobalOutlined, ClockCircleOutlined } from '@ant-design/icons';
import './RssNews.css';

const { Title, Text } = Typography;

const RssNews = () => {
    // Örnek haberler
    const newsItems = [
        {
            title: "Bitcoin 50,000 Doları Aştı",
            source: "CoinDesk",
            date: "2025-02-13",
            summary: "Bitcoin, son 6 ayın en yüksek seviyesine ulaşarak 50,000 doları aştı.",
            url: "https://www.coindesk.com"
        },
        {
            title: "Ethereum 2.0 Güncellemesi Yaklaşıyor",
            source: "CryptoNews",
            date: "2025-02-13",
            summary: "Ethereum ağı, büyük güncelleme öncesi son hazırlıklarını tamamlıyor.",
            url: "https://www.cryptonews.com"
        },
        {
            title: "Yeni DeFi Protokolü Duyuruldu",
            source: "Cointelegraph",
            date: "2025-02-13",
            summary: "Yenilikçi DeFi protokolü, kripto dünyasında heyecan yarattı.",
            url: "https://www.cointelegraph.com"
        }
    ];

    return (
        <div className="rss-news-container">
            <Title level={2}>Kripto Haberleri</Title>
            
            <List
                grid={{
                    gutter: 16,
                    xs: 1,
                    sm: 2,
                    md: 2,
                    lg: 3,
                    xl: 3,
                    xxl: 3,
                }}
                dataSource={newsItems}
                renderItem={item => (
                    <List.Item>
                        <Card
                            className="news-card"
                            hoverable
                            onClick={() => window.open(item.url, '_blank')}
                        >
                            <Title level={4}>{item.title}</Title>
                            <Text className="news-summary">{item.summary}</Text>
                            <div className="news-meta">
                                <Space>
                                    <GlobalOutlined />
                                    <Text type="secondary">{item.source}</Text>
                                </Space>
                                <Space>
                                    <ClockCircleOutlined />
                                    <Text type="secondary">{item.date}</Text>
                                </Space>
                            </div>
                        </Card>
                    </List.Item>
                )}
            />
        </div>
    );
};

export default RssNews;
