import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Tag, Statistic, Row, Col, Typography, List, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import axios from 'axios';
import './Portfolio.css';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const Portfolio = () => {
    const [portfolioData, setPortfolioData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPortfolioData();
        const interval = setInterval(fetchPortfolioData, 300000); // Her 5 dakikada bir güncelle
        return () => clearInterval(interval);
    }, []);

    const fetchPortfolioData = async () => {
        try {
            const response = await axios.get('http://localhost:8001/market/portfolio-coins');
            setPortfolioData(response.data);
            setLoading(false);
        } catch (err) {
            setError('Portföy verileri alınamadı');
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Coin',
            dataIndex: 'symbol',
            key: 'symbol',
            render: (text, record) => (
                <span>
                    <strong>{text}</strong>
                    <br />
                    <Text type="secondary">{record.name}</Text>
                </span>
            ),
        },
        {
            title: 'Fiyat',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `$${price.toLocaleString()}`,
        },
        {
            title: '24s Değişim',
            dataIndex: 'change_24h',
            key: 'change_24h',
            render: (change) => (
                <Text type={change >= 0 ? 'success' : 'danger'}>
                    {change >= 0 ? '+' : ''}{change}%
                </Text>
            ),
        },
        {
            title: 'Pozisyon',
            dataIndex: 'position',
            key: 'position',
            render: (position) => (
                <span>
                    Miktar: {position.amount}
                    <br />
                    Ort. Fiyat: ${position.avg_price}
                </span>
            ),
        },
        {
            title: 'Kar/Zarar',
            dataIndex: ['position', 'profit_loss'],
            key: 'profit_loss',
            render: (profit) => (
                <Text type={profit >= 0 ? 'success' : 'danger'}>
                    {profit >= 0 ? '+' : ''}{profit}%
                </Text>
            ),
        },
        {
            title: 'Analiz',
            dataIndex: 'analysis',
            key: 'analysis',
            render: (analysis) => (
                <span>
                    <Tag color={analysis.trend === 'BULLISH' ? 'green' : analysis.trend === 'BEARISH' ? 'red' : 'gold'}>
                        {analysis.trend}
                    </Tag>
                    <br />
                    <Text type="secondary">Güç: {analysis.strength}/10</Text>
                </span>
            ),
        },
    ];

    if (loading) return <Spin size="large" />;
    if (error) return <Text type="danger">{error}</Text>;
    if (!portfolioData) return null;

    return (
        <div className="portfolio-container">
            <Row gutter={[16, 16]} className="portfolio-summary">
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Toplam Portföy Değeri"
                            value={portfolioData.portfolio_summary.total_value}
                            precision={2}
                            prefix="$"
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Toplam Kar/Zarar"
                            value={portfolioData.portfolio_summary.total_profit_loss}
                            precision={2}
                            prefix="+"
                            suffix="%"
                            valueStyle={{ color: portfolioData.portfolio_summary.total_profit_loss >= 0 ? '#3f8600' : '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Risk Seviyesi"
                            value={portfolioData.portfolio_summary.risk_level}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Çeşitlendirme Skoru"
                            value={portfolioData.portfolio_summary.diversification_score}
                            suffix="/10"
                        />
                    </Card>
                </Col>
            </Row>

            <Card className="portfolio-content">
                <Tabs defaultActiveKey="0">
                    {portfolioData.categories.map((category, index) => (
                        <TabPane tab={category.name} key={index}>
                            <Table
                                dataSource={category.coins}
                                columns={columns}
                                rowKey="symbol"
                                expandable={{
                                    expandedRowRender: (record) => (
                                        <div className="coin-details">
                                            <Row gutter={[16, 16]}>
                                                <Col span={8}>
                                                    <Card title="Hedef Fiyatlar">
                                                        <p>Hedef: ${record.analysis.target_price}</p>
                                                        <p>Stop Loss: ${record.analysis.stop_loss}</p>
                                                    </Card>
                                                </Col>
                                                <Col span={8}>
                                                    <Card title="Temel Metrikler">
                                                        <List
                                                            size="small"
                                                            dataSource={Object.entries(record.analysis.key_metrics)}
                                                            renderItem={([key, value]) => (
                                                                <List.Item>
                                                                    <Text>{key.replace(/_/g, ' ').toUpperCase()}: {value}</Text>
                                                                </List.Item>
                                                            )}
                                                        />
                                                    </Card>
                                                </Col>
                                                {record.analysis.highlights && (
                                                    <Col span={8}>
                                                        <Card title="Öne Çıkanlar">
                                                            <List
                                                                size="small"
                                                                dataSource={record.analysis.highlights}
                                                                renderItem={(item) => (
                                                                    <List.Item>
                                                                        <Text>{item}</Text>
                                                                    </List.Item>
                                                                )}
                                                            />
                                                        </Card>
                                                    </Col>
                                                )}
                                            </Row>
                                        </div>
                                    ),
                                }}
                            />
                        </TabPane>
                    ))}
                </Tabs>
            </Card>
        </div>
    );
};

export default Portfolio;
