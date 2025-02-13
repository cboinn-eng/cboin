import React, { useState, useEffect, useRef } from 'react';
import { Table, Tag, Typography, Spin, Card, List, Tooltip, Space, Statistic, Progress, Button } from 'antd';
import { CaretUpOutlined, CaretDownOutlined, LoadingOutlined, DollarOutlined, BarChartOutlined, ClockCircleOutlined, SyncOutlined, LineChartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { ENDPOINTS } from '../../config/api';
import './Strategy.css';

const { Title } = Typography;
const ANALYSIS_INTERVAL = 3 * 60; // 3 dakika (saniye cinsinden)
const FETCH_INTERVAL = 10; // 10 saniye (API kontrol aralığı)

const Strategy = () => {
    const [signals, setSignals] = useState([]);
    const [analyzedCoins, setAnalyzedCoins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [countdown, setCountdown] = useState(ANALYSIS_INTERVAL);
    const [activeCoins, setActiveCoins] = useState(new Set());
    const [stats, setStats] = useState({
        totalCoins: 0,
        buySignals: 0,
        sellSignals: 0,
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [signalsResponse, coinsResponse] = await Promise.all([
                axios.get(ENDPOINTS.MARKET.SIGNALS),
                axios.get(ENDPOINTS.MARKET.ANALYZED_COINS)
            ]);

            // Yeni sinyaller varsa state'i güncelle
            if (signalsResponse.data && signalsResponse.data.signals) {
                const signals = signalsResponse.data.signals;
                
                // Önceki sinyallerle karşılaştır
                const prevSignalsStr = JSON.stringify(signals);
                const currentSignalsStr = JSON.stringify(signals);
                
                if (prevSignalsStr !== currentSignalsStr) {
                    setSignals(signals);
                    setLastUpdate(new Date().toLocaleTimeString());
                    setCountdown(ANALYSIS_INTERVAL);
                    
                    // Aktif coinleri güncelle
                    const activeCoinsSet = new Set(signals.map(s => s.symbol.replace('/USDT', '')));
                    setActiveCoins(activeCoinsSet);
                    
                    // İstatistikleri güncelle
                    setStats({
                        totalCoins: signals.length,
                        buySignals: signals.filter(s => s.signal === 'BUY').length,
                        sellSignals: signals.filter(s => s.signal === 'SELL').length,
                    });
                }
            }

            if (coinsResponse.data && coinsResponse.data.data) {
                setAnalyzedCoins(coinsResponse.data.data);
            }

            setError(null);
        } catch (err) {
            console.error('Veriler alınırken hata:', err);
            setError('Veriler alınamadı. Lütfen daha sonra tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    // İlk yükleme ve periyodik kontrol
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, FETCH_INTERVAL * 1000);
        return () => clearInterval(interval);
    }, []);

    // Geri sayım için
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    return ANALYSIS_INTERVAL;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatCountdown = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const renderIndicatorValue = (value, threshold = 0) => {
        if (!value && value !== 0) return '-';
        const formattedValue = value.toFixed(2);
        const isPositive = value > threshold;
        const tooltipText = isPositive ? 
            `Değer ${formattedValue} > ${threshold} (Pozitif trend)` : 
            `Değer ${formattedValue} < ${threshold} (Negatif trend)`;
            
        return (
            <Tooltip title={tooltipText}>
                <span className="indicator-value">
                    {formattedValue}
                    {isPositive ? (
                        <CaretUpOutlined style={{ color: 'var(--neon-green)' }} className="trend-icon" />
                    ) : (
                        <CaretDownOutlined style={{ color: 'var(--neon-red)' }} className="trend-icon" />
                    )}
                </span>
            </Tooltip>
        );
    };

    const tooltipRef = useRef(null);

    if (loading) return (
        <div className="loading-spinner">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        </div>
    );

    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="strategy-container">
            <div className="strategy-header">
                <Space align="baseline" style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between' }}>
                    <Title level={2}>Strateji Paneli</Title>
                    <Space size="large">
                        <div className="countdown-container">
                            <Progress
                                type="circle"
                                percent={((ANALYSIS_INTERVAL - countdown) / ANALYSIS_INTERVAL) * 100}
                                format={() => formatCountdown(countdown)}
                                size={50}
                                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                            />
                            <span className="countdown-label">Sonraki Analiz</span>
                        </div>
                        {lastUpdate && (
                            <Tooltip title="En son analiz güncelleme zamanı">
                                <Tag icon={<ClockCircleOutlined />} color="blue">
                                    Son Güncelleme: {lastUpdate}
                                </Tag>
                            </Tooltip>
                        )}
                        <Button 
                            icon={<SyncOutlined spin={loading} />} 
                            onClick={fetchData}
                            loading={loading}
                        >
                            Yenile
                        </Button>
                    </Space>
                </Space>

                <Card className="analyzed-coins-card">
                    <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
                        <Title level={4}>Analiz Özeti</Title>
                        <Space size="large">
                            <Tooltip title="Şu anda analiz edilen toplam coin sayısı">
                                <Statistic 
                                    title="Toplam Coin"
                                    value={stats.totalCoins}
                                    prefix={<BarChartOutlined />}
                                />
                            </Tooltip>
                            <Tooltip title="Son analizde AL sinyali veren coin sayısı">
                                <Statistic 
                                    title="Alış Sinyali"
                                    value={stats.buySignals}
                                    valueStyle={{ color: 'var(--neon-green)' }}
                                    prefix={<CaretUpOutlined />}
                                />
                            </Tooltip>
                            <Tooltip title="Son analizde SAT sinyali veren coin sayısı">
                                <Statistic 
                                    title="Satış Sinyali"
                                    value={stats.sellSignals}
                                    valueStyle={{ color: 'var(--neon-red)' }}
                                    prefix={<CaretDownOutlined />}
                                />
                            </Tooltip>
                        </Space>
                    </Space>

                    <List
                        grid={{ gutter: 16, column: 6 }}
                        dataSource={analyzedCoins}
                        renderItem={coin => {
                            const isActive = activeCoins.has(coin.symbol.replace('/USDT', ''));
                            const tooltipTitle = isActive ? 
                                `${coin.symbol} şu anda analiz ediliyor ve sinyal takibi yapılıyor` : 
                                `${coin.symbol} henüz analiz edilmedi veya sinyal bekleniyor`;
                            return (
                                <List.Item>
                                    <Tooltip ref={tooltipRef} title={tooltipTitle} placement="top" mouseEnterDelay={0.5}>
                                        <div>
                                            <Tag 
                                                className={`coin-tag ${isActive ? 'active-coin' : 'inactive-coin'}`}
                                                icon={isActive ? <SyncOutlined spin /> : <ClockCircleOutlined />}
                                            >
                                                {coin.symbol}
                                            </Tag>
                                        </div>
                                    </Tooltip>
                                </List.Item>
                            );
                        }}
                    />
                </Card>
            </div>

            <Table
                columns={[
                    {
                        title: 'Coin',
                        dataIndex: 'symbol',
                        key: 'symbol',
                        render: (text) => (
                            <Tooltip title="İşlem gören coin sembolü">
                                <strong>{text}</strong>
                            </Tooltip>
                        ),
                        fixed: 'left',
                        width: 120
                    },
                    {
                        title: 'Sinyal',
                        dataIndex: 'signal',
                        key: 'signal',
                        render: (signal) => {
                            const signalMap = {
                                'BUY': { text: 'AL', color: 'green', desc: 'Alış sinyali - fiyat yükselişi bekleniyor' },
                                'SELL': { text: 'SAT', color: 'red', desc: 'Satış sinyali - fiyat düşüşü bekleniyor' },
                                'WAIT': { text: 'BEKLE', color: 'default', desc: 'Bekle sinyali - trend belirsiz' }
                            };
                            const signalInfo = signalMap[signal] || signalMap['WAIT'];
                            return (
                                <Tooltip title={signalInfo.desc}>
                                    <Tag color={signalInfo.color}>{signalInfo.text}</Tag>
                                </Tooltip>
                            );
                        },
                        width: 100
                    },
                    {
                        title: 'Zaman Dilimi',
                        dataIndex: 'timeframe',
                        key: 'timeframe',
                        render: (timeframe) => (
                            <Tooltip title="Analiz edilen mum grafiği zaman aralığı">
                                <Tag>{timeframe}</Tag>
                            </Tooltip>
                        ),
                        width: 120
                    },
                    {
                        title: 'RSI',
                        dataIndex: 'rsi',
                        key: 'rsi',
                        render: (value) => {
                            const tooltipText = value > 70 ? 'Aşırı alım bölgesi' : 
                                              value < 30 ? 'Aşırı satım bölgesi' : 
                                              'Nötr bölge';
                            return (
                                <Tooltip title={`RSI Değeri: ${value?.toFixed(2)} - ${tooltipText}`}>
                                    {renderIndicatorValue(value, 50)}
                                </Tooltip>
                            );
                        },
                        width: 120
                    },
                    {
                        title: 'Stochastic',
                        dataIndex: 'stoch',
                        key: 'stoch',
                        render: (value) => {
                            const tooltipText = value > 80 ? 'Aşırı alım bölgesi' : 
                                              value < 20 ? 'Aşırı satım bölgesi' : 
                                              'Nötr bölge';
                            return (
                                <Tooltip title={`Stochastic Değeri: ${value?.toFixed(2)} - ${tooltipText}`}>
                                    {renderIndicatorValue(value, 50)}
                                </Tooltip>
                            );
                        },
                        width: 120
                    },
                    {
                        title: 'Fiyat',
                        dataIndex: 'price',
                        key: 'price',
                        render: (value) => {
                            if (!value && value !== 0) return '-';
                            return (
                                <Tooltip title="Coinin anlık USDT fiyatı">
                                    <Tag icon={<DollarOutlined />} color="blue">
                                        ${value.toFixed(4)}
                                    </Tag>
                                </Tooltip>
                            );
                        },
                        width: 140
                    },
                    {
                        title: '24s Değişim',
                        dataIndex: 'priceChange24h',
                        key: 'priceChange24h',
                        render: (value) => {
                            if (!value && value !== 0) return '-';
                            const icon = value >= 0 ? <CaretUpOutlined /> : <CaretDownOutlined />;
                            const tooltipText = value >= 0 ? 
                                `Son 24 saatte %${value.toFixed(2)} artış` : 
                                `Son 24 saatte %${Math.abs(value).toFixed(2)} düşüş`;
                            return (
                                <Tooltip title={tooltipText}>
                                    <Tag icon={icon} color={value >= 0 ? 'green' : 'red'}>
                                        {value.toFixed(2)}%
                                    </Tag>
                                </Tooltip>
                            );
                        },
                        width: 120
                    }
                ]}
                dataSource={signals}
                rowKey={(record) => `${record.symbol}-${record.timeframe}`}
                pagination={false}
                className="signals-table"
                scroll={{ x: 'max-content' }}
            />
        </div>
    );
};

export default Strategy;