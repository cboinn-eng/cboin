import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, List, Tag, Space, Avatar } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, HeartOutlined, RetweetOutlined } from '@ant-design/icons';
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
import './Dashboard.css';

const { Title, Text } = Typography;

const Dashboard = () => {
    const [priceData, setPriceData] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [news, setNews] = useState([]);
    const [tweets, setTweets] = useState([]); // Twitter verileri için state eklendi
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
            const tweetsResponse = await axios.get('http://localhost:8001/api/twitter/analiz'); // Twitter verileri için API çağrısı eklendi

            setPriceData(priceResponse.data);
            setPredictions(predictionResponse.data.predictions);
            setNews(newsResponse.data.Data);
            setTweets(tweetsResponse.data); // Twitter verileri state'e atanıyor
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
                            title="Dominance"
                            value={marketStats?.btcDominance}
                            precision={2}
                            suffix="%"
                        />
                    </Card>
                </Col>
            </Row>

            {/* Fiyat Grafiği ve Tahminler */}
            <Row gutter={[16, 16]} className="chart-row">
                <Col xs={24}>
                    <Card title="Bitcoin Fiyat Grafiği ve Tahminler">
                        {renderPriceChart()}
                    </Card>
                </Col>
            </Row>

            {/* Haberler, Tahminler ve Twitter */}
            <Row gutter={[16, 16]} className="content-row">
                <Col xs={24} lg={16}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24}>
                            <Card title="Kripto Para Haberleri" className="news-card">
                                <List
                                    itemLayout="vertical"
                                    dataSource={news}
                                    renderItem={item => (
                                        <List.Item
                                            extra={
                                                item.imageurl && (
                                                    <img
                                                        width={200}
                                                        alt="news"
                                                        src={item.imageurl}
                                                    />
                                                )
                                            }
                                        >
                                            <List.Item.Meta
                                                title={<a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>}
                                                description={
                                                    <>
                                                        <Text type="secondary">{new Date(item.published_on * 1000).toLocaleString()}</Text>
                                                        <br />
                                                        <Tag color="blue">{item.categories}</Tag>
                                                    </>
                                                }
                                            />
                                            {item.body}
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </Col>
                        <Col xs={24}>
                            <Card title="Twitter Analiz Sonuçları" className="twitter-card">
                                <List
                                    itemLayout="vertical"
                                    dataSource={tweets}
                                    renderItem={tweet => (
                                        <List.Item
                                            extra={
                                                tweet.media_url && (
                                                    <img
                                                        width={200}
                                                        alt="tweet media"
                                                        src={tweet.media_url}
                                                        style={{ borderRadius: '8px' }}
                                                    />
                                                )
                                            }
                                        >
                                            <List.Item.Meta
                                                avatar={<Avatar src={tweet.profile_image_url} />}
                                                title={
                                                    <Space>
                                                        <Text strong>{tweet.username}</Text>
                                                        <Text type="secondary">@{tweet.screen_name}</Text>
                                                    </Space>
                                                }
                                                description={
                                                    <>
                                                        <Text>{tweet.text}</Text>
                                                        <br />
                                                        <Space size="large" style={{ marginTop: '8px' }}>
                                                            <Text type="secondary">
                                                                <Space>
                                                                    <HeartOutlined />
                                                                    {tweet.favorite_count}
                                                                </Space>
                                                            </Text>
                                                            <Text type="secondary">
                                                                <Space>
                                                                    <RetweetOutlined />
                                                                    {tweet.retweet_count}
                                                                </Space>
                                                            </Text>
                                                            <Text type="secondary">
                                                                {new Date(tweet.created_at).toLocaleString()}
                                                            </Text>
                                                        </Space>
                                                        {tweet.sentiment && (
                                                            <div style={{ marginTop: '8px' }}>
                                                                <Tag color={
                                                                    tweet.sentiment === 'positive' ? 'success' :
                                                                    tweet.sentiment === 'negative' ? 'error' : 'warning'
                                                                }>
                                                                    {tweet.sentiment.toUpperCase()}
                                                                </Tag>
                                                            </div>
                                                        )}
                                                    </>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="SARIMA Tahminleri" className="predictions-card">
                        <List
                            dataSource={predictions.slice(0, 7)}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={new Date(item.date).toLocaleDateString()}
                                        description={
                                            <>
                                                <Text strong>Tahmin: </Text>
                                                <Text>${item.prediction.toLocaleString()}</Text>
                                                <br />
                                                <Text type="secondary">
                                                    Aralık: ${item.lower_bound.toLocaleString()} - ${item.upper_bound.toLocaleString()}
                                                </Text>
                                            </>
                                        }
                                    />
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
