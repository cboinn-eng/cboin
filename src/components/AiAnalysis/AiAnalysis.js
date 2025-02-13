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
      const response = await axios.get(ENDPOINTS.MARKET.PREDICTIONS);
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
      await axios.get(ENDPOINTS.MARKET.PREDICTIONS_UPDATE);
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
      const response = await axios.post('http://localhost:8001/model/sarima', {
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

  useEffect(() => {
    return () => {
      if (analysisInterval) {
        clearInterval(analysisInterval);
      }
    };
  }, []);

  const filteredPredictions = predictions.slice(0, selectedPeriod);

  const chartConfig = {
    data: filteredPredictions,
    xField: 'date',
    yField: 'prediction',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    xAxis: {
      type: 'time',
      label: {
        formatter: (v) => new Date(v).toLocaleDateString(),
      },
    },
    yAxis: {
      label: {
        formatter: (v) => `$${Number(v).toLocaleString()}`,
      },
    },
    tooltip: {
      showMarkers: true,
      formatter: (datum) => {
        return {
          name: datum.type,
          value: `$${Number(datum.value).toLocaleString()}`,
        };
      },
    },
  };

  // Grafik için veriyi hazırla
  const chartData = filteredPredictions.flatMap((p) => [
    { date: p.date, value: p.prediction, type: 'Tahmin' },
    { date: p.date, value: p.lower_bound, type: 'Alt Sınır' },
    { date: p.date, value: p.upper_bound, type: 'Üst Sınır' },
  ]);

  const columns = [
    {
      title: 'Tarih',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Mevcut Fiyat',
      dataIndex: 'current_price',
      key: 'current_price',
      render: (value) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Tahmin',
      dataIndex: 'prediction',
      key: 'prediction',
      render: (value) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Değişim',
      key: 'change',
      render: (_, record) => {
        const change = ((record.prediction - record.current_price) / record.current_price) * 100;
        const color = change >= 0 ? '#3f8600' : '#cf1322';
        const icon = change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
        return (
          <Tag color={color}>
            {icon} {Math.abs(change).toFixed(2)}%
          </Tag>
        );
      },
    },
  ];

  const renderAnalysisStatus = () => {
    switch (analysisStatus) {
      case 'running':
        return (
          <Alert
            message="Analiz Devam Ediyor"
            description={
              <Space direction="vertical">
                <Typography.Text>SARIMA modeli eğitiliyor ve tahminler hesaplanıyor...</Typography.Text>
                <Progress 
                  percent={Math.round(analysisProgress)} 
                  status="active"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <Typography.Text>Tahmini kalan süre: {Math.ceil(totalTime - (analysisProgress / 100 * totalTime))} saniye</Typography.Text>
              </Space>
            }
            type="info"
            showIcon
            icon={<LoadingOutlined />}
          />
        );
      case 'completed':
        return (
          <Alert
            message="Analiz Tamamlandı"
            description="SARIMA model tahminleri başarıyla güncellendi."
            type="success"
            showIcon
          />
        );
      case 'error':
        return (
          <Alert
            message="Hata"
            description={analysisError}
            type="error"
            showIcon
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>Tahminler yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Hata"
        description={error}
        type="error"
        showIcon
        action={
          <Button onClick={fetchPredictions} type="primary">
            Tekrar Dene
          </Button>
        }
      />
    );
  }

  return (
    <div className="ai-analysis-container">
      <Row gutter={[16, 16]} className="header-row">
        <Col span={16}>
          <h2>Bitcoin Fiyat Tahminleri</h2>
          <p className="last-update">Son güncelleme: {lastUpdate}</p>
        </Col>
        <Col span={8} style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SyncOutlined spin={updating} />}
            onClick={updatePredictions}
            loading={updating}
          >
            Tahminleri Güncelle
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Mevcut Fiyat"
              value={predictions[0]?.current_price}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="7 Günlük Tahmin"
              value={predictions[6]?.prediction}
              precision={2}
              prefix="$"
              valueStyle={{
                color: predictions[6]?.prediction > predictions[0]?.current_price ? '#3f8600' : '#cf1322',
              }}
              suffix={
                <Tag color={predictions[6]?.prediction > predictions[0]?.current_price ? 'success' : 'error'}>
                  {(((predictions[6]?.prediction - predictions[0]?.current_price) / predictions[0]?.current_price) * 100).toFixed(2)}%
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="30 Günlük Tahmin"
              value={predictions[29]?.prediction}
              precision={2}
              prefix="$"
              valueStyle={{
                color: predictions[29]?.prediction > predictions[0]?.current_price ? '#3f8600' : '#cf1322',
              }}
              suffix={
                <Tag color={predictions[29]?.prediction > predictions[0]?.current_price ? 'success' : 'error'}>
                  {(((predictions[29]?.prediction - predictions[0]?.current_price) / predictions[0]?.current_price) * 100).toFixed(2)}%
                </Tag>
              }
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Line {...chartConfig} data={chartData} />
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          dataSource={filteredPredictions}
          columns={columns}
          rowKey="date"
          pagination={{ pageSize: 7 }}
        />
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Button
          type="primary"
          size="large"
          onClick={startAnalysis}
          loading={analysisLoading}
          disabled={analysisStatus === 'running'}
          block
        >
          {analysisStatus === 'running' ? 'Analiz Devam Ediyor...' : 'Analizi Başlat'}
        </Button>
        {renderAnalysisStatus()}
      </Card>
    </div>
  );
};

export default AiAnalysis;
