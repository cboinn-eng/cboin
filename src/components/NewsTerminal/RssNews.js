import React, { useState, useEffect } from 'react';
import axios from '../../config/axios.config';
import { List, Typography, Tag, Tooltip, Button, Space, Spin } from 'antd';
import { 
    GlobalOutlined, 
    ClockCircleOutlined, 
    LinkOutlined 
} from '@ant-design/icons';
import moment from 'moment';

const { Text, Paragraph } = Typography;

const RssNews = ({ onNewsClick }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRssNews();
    }, []);

    const fetchRssNews = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/rss-news');
            if (response.data && response.data.items) {
                setNews(response.data.items);
            }
        } catch (err) {
            console.error('RSS haberleri alınırken hata:', err);
            setError('Haberler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
                <Text style={{ display: 'block', marginTop: '10px' }}>
                    Haberler yükleniyor...
                </Text>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text type="danger">{error}</Text>
                <Button 
                    onClick={fetchRssNews} 
                    style={{ marginTop: '10px' }}
                >
                    Tekrar Dene
                </Button>
            </div>
        );
    }

    return (
        <List
            itemLayout="vertical"
            dataSource={news}
            renderItem={(item) => (
                <List.Item
                    key={item.link}
                    actions={[
                        <Space key="source">
                            <Tooltip title="Kaynak">
                                <GlobalOutlined />
                                <Text>{item.source}</Text>
                            </Tooltip>
                        </Space>,
                        <Space key="date">
                            <Tooltip title="Yayın Tarihi">
                                <ClockCircleOutlined />
                                <Text>{moment(item.pubDate).format('DD.MM.YYYY HH:mm')}</Text>
                            </Tooltip>
                        </Space>,
                        <Tooltip key="link" title="Habere Git">
                            <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                <LinkOutlined />
                            </a>
                        </Tooltip>
                    ]}
                >
                    <List.Item.Meta
                        title={
                            <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={() => onNewsClick && onNewsClick(item)}
                            >
                                {item.title}
                            </a>
                        }
                        description={
                            <Paragraph ellipsis={{ rows: 3 }}>
                                {item.description}
                            </Paragraph>
                        }
                    />
                    {item.categories && (
                        <div style={{ marginTop: '10px' }}>
                            {item.categories.map((category, index) => (
                                <Tag key={index} color="blue">
                                    {category}
                                </Tag>
                            ))}
                        </div>
                    )}
                </List.Item>
            )}
        />
    );
};

export default RssNews;
