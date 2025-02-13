import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, List, Tag, Space, Avatar } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, HeartOutlined, RetweetOutlined, TwitterOutlined } from '@ant-design/icons';
import axios from 'axios';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import TwitterFeed from '../Social/TwitterFeed';
import './Dashboard.css';

const { Title, Text } = Typography;

const Dashboard = () => {
    const [priceData, setPriceData] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [news, setNews] = useState([]);
    const [marketStats, setMarketStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Her dakika güncelle
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            // Fiyat ve tahmin verilerini al
            const priceResponse = await axios.get('http://localhost:8001/api/price/history');
            const predictionResponse = await axios.get('http://localhost:8001/api/predictions');
            const newsResponse = await axios.get('http://localhost:8001/api/news');
            const marketResponse = await axios.get('http://localhost:8001/api/market/stats');

            setPriceData(priceResponse.data);
            setPredictions(predictionResponse.data.predictions);
            setNews(newsResponse.data.Data);
            setMarketStats(marketResponse.data);
            setLoading(false);
        } catch (error) {
            console.error('Veri çekme hatası:', error);
        }
    };

    const renderPriceChart = () => (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="#8884d8" name="Fiyat" />
                <Line type="monotone" dataKey="prediction" stroke="#82ca9d" name="Tahmin" strokeDasharray="5 5" />
            </LineChart>
        </ResponsiveContainer>
    );

    return (
        <div className="dashboard-container">
            {/* Market İstatistikleri */}
            <Row gutter={[16, 16]} className="stats-row">
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Bitcoin Fiyatı"
                            value={marketStats?.currentPrice}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: marketStats?.priceChange >= 0 ? '#3f8600' : '#cf1322' }}
                            suffix={
                                <span>
                                    {marketStats?.priceChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(marketStats?.priceChange)}%
                                </span>
                            }
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="24s Hacim"
                            value={marketStats?.volume24h}
                            precision={0}
                            prefix="$"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Market Değeri"
                            value={marketStats?.marketCap}
                            precision={0}
                            prefix="$"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="24s Değişim"
                            value={marketStats?.priceChange}
                            precision={2}
                            suffix="%"
                            valueStyle={{ color: marketStats?.priceChange >= 0 ? '#3f8600' : '#cf1322' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Fiyat Grafiği */}
            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                <Col xs={24} lg={16}>
                    <Card title="Bitcoin Fiyat Grafiği">
                        {renderPriceChart()}
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <TwitterFeed username="bitcoin" />
                </Col>
            </Row>

            {/* Haberler ve Tahminler */}
            <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                <Col xs={24} lg={12}>
                    <Card title="Son Haberler">
                        <List
                            dataSource={news.slice(0, 5)}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={<a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>}
                                        description={item.body}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Fiyat Tahminleri">
                        <List
                            dataSource={predictions.slice(0, 5)}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={`${new Date(item.timestamp).toLocaleDateString()} Tahmini`}
                                        description={`Tahmin Edilen Fiyat: $${item.predicted_price.toFixed(2)}`}
                                    />
                                    <Tag color={item.accuracy > 80 ? 'green' : item.accuracy > 60 ? 'orange' : 'red'}>
                                        {item.accuracy}% Doğruluk
                                    </Tag>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
