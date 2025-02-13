import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tag, Button, Table, Spin, Alert, Progress, Space, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SyncOutlined, LoadingOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import axios from 'axios';
import { ENDPOINTS } from '../../config/api';
import './AiAnalysis.css';

const AiAnalysis = () => {
  const [predictions, setPredictions] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(7); // Default 7 gün
  const [lastUpdate, setLastUpdate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // idle, running, completed, error
  const [analysisError, setAnalysisError] = useState(null);
  const totalTime = 70; // 70 saniye
  let analysisInterval;

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ENDPOINTS.AI.PREDICTIONS);
      const data = response.data;
      setPredictions(data.predictions || []);
      setLastUpdate(data.last_update || new Date().toLocaleString());
      setError(null);
    } catch (error) {
      console.error('Tahminler alınırken hata:', error);
      setError('Tahminler alınamadı. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const updatePredictions = async () => {
    try {
      setUpdating(true);
      await axios.get(ENDPOINTS.AI.PREDICTIONS_UPDATE);
      await fetchPredictions();
    } catch (error) {
      console.error('Tahminler güncellenirken hata:', error);
      setError('Tahminler güncellenemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setUpdating(false);
    }
  };

  const startAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      setAnalysisStatus('running');
      setAnalysisProgress(0);
      setAnalysisError(null);

      // Progress bar için interval başlat
      let currentProgress = 0;
      analysisInterval = setInterval(() => {
        currentProgress++;
        setAnalysisProgress((currentProgress / totalTime) * 100);
        
        if (currentProgress >= totalTime) {
          clearInterval(analysisInterval);
        }
      }, 1000);

      // SARIMA modelini başlat
      const response = await axios.post(ENDPOINTS.AI.START_MODEL, {
        coin: 'BTC'  // Coin parametresini body'de gönder
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearInterval(analysisInterval);
      setAnalysisProgress(100);
      setAnalysisStatus('completed');
      setAnalysisLoading(false);
      
      // Analiz tamamlandıktan sonra tahminleri yeniden yükle
      await fetchPredictions();

    } catch (error) {
      clearInterval(analysisInterval);
      // Hata mesajını string'e çevir
      const errorMessage = typeof error.response?.data?.detail === 'object' 
        ? JSON.stringify(error.response.data.detail)
        : error.response?.data?.detail || 'Analiz sırasında bir hata oluştu';
      setAnalysisError(errorMessage);
      setAnalysisStatus('error');
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 5 * 60 * 1000); // Her 5 dakikada bir güncelle
    return () => clearInterval(interval);
  }, []);

  const renderLineChart = () => {
    if (!predictions.length) return null;

    const chartData = predictions.map(item => ({
      date: new Date(item.timestamp).toLocaleDateString(),
      price: item.actual_price,
      prediction: item.predicted_price
    }));

    const config = {
      data: chartData,
      xField: 'date',
      yField: ['price', 'prediction'],
      seriesField: 'type',
      color: ['#1890ff', '#f5222d'],
      point: {
        size: 5,
        shape: 'diamond',
      },
      tooltip: {
        showMarkers: false,
      },
      state: {
        active: {
          style: {
            shadowBlur: 4,
            stroke: '#000',
            fill: 'red',
          },
        },
      },
      interactions: [
        {
          type: 'marker-active',
        },
      ],
    };

    return <Line {...config} />;
  };

  const columns = [
    {
      title: 'Tarih',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: text => new Date(text).toLocaleString()
    },
    {
      title: 'Gerçek Fiyat',
      dataIndex: 'actual_price',
      key: 'actual_price',
      render: price => `$${price.toFixed(2)}`
    },
    {
      title: 'Tahmin',
      dataIndex: 'predicted_price',
      key: 'predicted_price',
      render: price => `$${price.toFixed(2)}`
    },
    {
      title: 'Doğruluk',
      dataIndex: 'accuracy',
      key: 'accuracy',
      render: accuracy => (
        <Tag color={accuracy > 80 ? 'green' : accuracy > 60 ? 'orange' : 'red'}>
          {accuracy.toFixed(2)}%
        </Tag>
      )
    }
  ];

  return (
    <div className="ai-analysis-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="SARIMA Model Analizi" extra={
            <Space>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                loading={updating}
                onClick={updatePredictions}
              >
                Tahminleri Güncelle
              </Button>
              <Button
                type="default"
                icon={analysisLoading ? <LoadingOutlined /> : <SyncOutlined />}
                loading={analysisLoading}
                onClick={startAnalysis}
                disabled={analysisStatus === 'running'}
              >
                Yeni Analiz Başlat
              </Button>
            </Space>
          }>
            {error && (
              <Alert
                message="Hata"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {analysisStatus === 'running' && (
              <div style={{ marginBottom: 16 }}>
                <Progress
                  percent={Math.round(analysisProgress)}
                  status={analysisStatus === 'error' ? 'exception' : 'active'}
                />
                <Typography.Text type="secondary">
                  Analiz devam ediyor... ({Math.round(analysisProgress)}%)
                </Typography.Text>
              </div>
            )}

            {analysisError && (
              <Alert
                message="Analiz Hatası"
                description={analysisError}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  {renderLineChart()}
                </div>
                <Table
                  dataSource={predictions}
                  columns={columns}
                  rowKey="timestamp"
                  pagination={{ pageSize: 10 }}
                />
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AiAnalysis;
