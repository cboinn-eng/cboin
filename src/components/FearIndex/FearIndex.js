import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Tooltip, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import './FearIndex.css';

const FearIndex = () => {
    const [fearData, setFearData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('https://api.alternative.me/fng/');
            const data = response.data;
            
            if (data && data.data && data.data[0]) {
                setFearData(data.data[0]);
            }
            setError(null);
        } catch (error) {
            console.error('Fear & Greed Index alınırken hata:', error);
            setError('Veriler alınamadı. Lütfen daha sonra tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 300000); // Her 5 dakikada güncelle
        return () => clearInterval(interval);
    }, []);

    if (error) {
        return <Card className="fear-index-card error">{error}</Card>;
    }

    const fearIndex = fearData ? parseInt(fearData.value) : 50;
    const fearLevel = fearIndex <= 25 ? 'Aşırı Korku' :
                     fearIndex <= 45 ? 'Korku' :
                     fearIndex <= 55 ? 'Nötr' :
                     fearIndex <= 75 ? 'Açgözlülük' :
                     'Aşırı Açgözlülük';

    const description = {
        'Aşırı Korku': 'Piyasada aşırı satış baskısı var. Yatırımcılar panik halinde. Genellikle iyi bir alım fırsatı olabilir.',
        'Korku': 'Yatırımcılar tedirgin ve risk almaktan kaçınıyor. Fiyatlar baskı altında.',
        'Nötr': 'Piyasa dengeli bir durumda. Ne aşırı iyimserlik ne de aşırı kötümserlik hakim.',
        'Açgözlülük': 'Yatırımcılar iyimser ve risk almaya istekli. Fiyatlar yükseliş eğiliminde.',
        'Aşırı Açgözlülük': 'Piyasada aşırı alım var. Yatırımcılar FOMO etkisinde. Dikkatli olmak gerekebilir.'
    };

    const getGradientColor = (value) => {
        if (value <= 25) return 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)';
        if (value <= 45) return 'linear-gradient(135deg, #faad14 0%, #d48806 100%)';
        if (value <= 55) return 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)';
        if (value <= 75) return 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)';
        return 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)';
    };

    return (
        <Card loading={loading} className="fear-index-card">
            <div className="fear-index-3d-container">
                <div className="fear-index-content">
                    <Row gutter={[24, 24]}>
                        <Col span={24}>
                            <div className="fear-meter-container">
                                <div className="fear-meter" style={{background: getGradientColor(fearIndex)}}>
                                    <Statistic
                                        title={
                                            <div className="fear-index-title">
                                                <span>Korku & Açgözlülük Endeksi</span>
                                                <Tooltip title="Bu endeks, kripto para piyasasındaki genel duygu durumunu 0-100 arasında ölçer. 0 aşırı korku, 100 aşırı açgözlülüğü gösterir.">
                                                    <InfoCircleOutlined className="info-icon" />
                                                </Tooltip>
                                            </div>
                                        }
                                        value={fearIndex}
                                        precision={0}
                                        valueStyle={{
                                            color: '#ffffff',
                                            textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
                                        }}
                                        prefix={fearIndex <= 50 ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                                        suffix={` - ${fearLevel}`}
                                    />
                                    <Progress
                                        percent={fearIndex}
                                        showInfo={false}
                                        strokeColor={{
                                            '0%': '#ff4d4f',
                                            '25%': '#faad14',
                                            '50%': '#52c41a',
                                            '75%': '#1890ff',
                                            '100%': '#722ed1'
                                        }}
                                        className="fear-progress"
                                    />
                                </div>
                            </div>
                        </Col>
                    </Row>
                    <Row gutter={[24, 24]}>
                        <Col span={24}>
                            <div className="fear-description">
                                <h3>{fearLevel}</h3>
                                <p>{description[fearLevel]}</p>
                                <div className="fear-update-time">
                                    <ClockCircleOutlined />
                                    <span>Son Güncelleme: {fearData ? moment(fearData.timestamp * 1000).format('DD.MM.YYYY HH:mm') : '-'}</span>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>
        </Card>
    );
};

export default FearIndex;