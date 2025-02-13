import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Tooltip, Spin, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import './CoinMarket.css';

const { Title, Text } = Typography;

const CoinMarket = () => {
    const [coins, setCoins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCoin, setSelectedCoin] = useState(null);
    const [isModelRunning, setIsModelRunning] = useState(false);
    const [countdown, setCountdown] = useState(null);

    useEffect(() => {
        fetchCoins();
        const interval = setInterval(fetchCoins, 10000); // Her 10 saniyede bir güncelle
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isModelRunning) {
            // Model çalışmaya başladığında 5 dakikalık geri sayım başlat
            setCountdown(300); // 5 dakika = 300 saniye
            
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        } else {
            setCountdown(null);
        }
    }, [isModelRunning]);

    // Geri sayımı dakika:saniye formatına çevir
    const formatCountdown = (seconds) => {
        if (!seconds) return '';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const fetchCoins = async () => {
        try {
            const response = await axios.get('http://localhost:8001/market/coins');
            setCoins(response.data.coins);
            setLoading(false);
        } catch (err) {
            setError('Coin verileri alınamadı');
            setLoading(false);
        }
    };

    const fetchCoinDetail = async (symbol) => {
        try {
            const response = await axios.get(`http://localhost:8001/market/coins/${symbol}`);
            setSelectedCoin(response.data);
        } catch (err) {
            console.error('Coin detayı alınamadı:', err);
        }
    };

    const handleStartModel = async () => {
        try {
            setIsModelRunning(true);
            const response = await axios.post('http://localhost:8001/model/sarima', {
                coin: selectedCoin?.symbol || 'BTC'
            });
            
            // 5 dakika sonra modeli otomatik durdur
            setTimeout(() => {
                setIsModelRunning(false);
            }, 300000); // 5 dakika = 300,000 ms
            
        } catch (error) {
            console.error('Model başlatılırken hata:', error);
            setIsModelRunning(false);
        }
    };

    const handleStopModel = async () => {
        try {
            await axios.post('http://localhost:8001/model/stop');
            setIsModelRunning(false);
        } catch (error) {
            console.error('Model durdurulurken hata:', error);
        }
    };

    const columns = [
        {
            title: 'Coin',
            dataIndex: 'symbol',
            key: 'symbol',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Fiyat',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `$${price.toLocaleString()}`,
            sorter: (a, b) => a.price - b.price,
        },
        {
            title: '24s Değişim',
            dataIndex: 'price_change_24h',
            key: 'price_change_24h',
            render: (change) => (
                <Text type={change >= 0 ? 'success' : 'danger'}>
                    {change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {' '}
                    {Math.abs(change).toFixed(2)}%
                </Text>
            ),
            sorter: (a, b) => a.price_change_24h - b.price_change_24h,
        },
        {
            title: '24s Yüksek',
            dataIndex: 'high_24h',
            key: 'high_24h',
            render: (price) => `$${price.toLocaleString()}`,
        },
        {
            title: '24s Düşük',
            dataIndex: 'low_24h',
            key: 'low_24h',
            render: (price) => `$${price.toLocaleString()}`,
        },
        {
            title: 'Hacim',
            dataIndex: 'volume',
            key: 'volume',
            render: (volume) => `$${(volume).toLocaleString()}`,
            sorter: (a, b) => a.volume - b.volume,
        },
        {
            title: 'Market Değeri',
            dataIndex: 'market_cap',
            key: 'market_cap',
            render: (cap) => `$${(cap).toLocaleString()}`,
            sorter: (a, b) => a.market_cap - b.market_cap,
        },
        {
            title: 'Durum',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'up' ? 'green' : 'red'}>
                    {status === 'up' ? 'YÜKSELİŞTE' : 'DÜŞÜŞTE'}
                </Tag>
            ),
        },
    ];

    if (loading) return <Spin size="large" />;
    if (error) return <Text type="danger">{error}</Text>;

    return (
        <div className="coin-market-container">
            <div className="coin-market-header">
                <Title level={3}>Kripto Para Piyasası</Title>
                <Tooltip title="Yenile">
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={fetchCoins}
                        type="primary"
                        ghost
                    />
                </Tooltip>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <Button
                    type="primary"
                    onClick={handleStartModel}
                    disabled={isModelRunning || !selectedCoin}
                    style={{
                        backgroundColor: isModelRunning ? '#ffd700' : '#4CAF50',
                        color: 'black',
                    }}
                >
                    {isModelRunning ? (
                        <>
                            Model Çalışıyor... {countdown && `(${formatCountdown(countdown)})`}
                            <Spin 
                                indicator={<LoadingOutlined style={{ marginLeft: 10, fontSize: 20 }} spin />}
                            />
                        </>
                    ) : (
                        'Sarıma Modelini Başlat'
                    )}
                </Button>

                {isModelRunning && (
                    <Button
                        type="primary"
                        onClick={handleStopModel}
                        style={{
                            backgroundColor: '#f44336',
                            color: 'white',
                        }}
                    >
                        Modeli Durdur
                    </Button>
                )}
            </div>

            <Card className="coin-market-card">
                <Table
                    dataSource={coins}
                    columns={columns}
                    rowKey="symbol"
                    pagination={false}
                    scroll={{ x: true }}
                    onRow={(record) => ({
                        onClick: () => fetchCoinDetail(record.symbol)
                    })}
                />
            </Card>

            {selectedCoin && (
                <Card title={`${selectedCoin.symbol} Detayları`} className="coin-detail-card">
                    <div className="coin-detail-grid">
                        <div className="detail-item">
                            <Text type="secondary">Son İşlemler</Text>
                            <Table
                                dataSource={selectedCoin.trades}
                                columns={[
                                    {
                                        title: 'Fiyat',
                                        dataIndex: 'price',
                                        render: (price) => `$${price.toLocaleString()}`
                                    },
                                    {
                                        title: 'Miktar',
                                        dataIndex: 'quantity',
                                        render: (qty) => qty.toLocaleString()
                                    }
                                ]}
                                pagination={false}
                                size="small"
                            />
                        </div>
                        
                        <div className="detail-item">
                            <Text type="secondary">Emir Defteri</Text>
                            <div className="orderbook">
                                <div className="orderbook-side">
                                    <Text type="success">Alış</Text>
                                    {selectedCoin.orderbook.bids.map((bid, index) => (
                                        <div key={index} className="orderbook-row">
                                            <Text type="success">${bid.price.toLocaleString()}</Text>
                                            <Text>{bid.quantity.toLocaleString()}</Text>
                                        </div>
                                    ))}
                                </div>
                                <div className="orderbook-side">
                                    <Text type="danger">Satış</Text>
                                    {selectedCoin.orderbook.asks.map((ask, index) => (
                                        <div key={index} className="orderbook-row">
                                            <Text type="danger">${ask.price.toLocaleString()}</Text>
                                            <Text>{ask.quantity.toLocaleString()}</Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default CoinMarket;
