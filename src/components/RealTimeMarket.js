import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Typography } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const { Title } = Typography;

const RealTimeMarket = () => {
  const [marketData, setMarketData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/market');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (Array.isArray(data)) {
        setMarketData(data);
        setLastUpdate(new Date());
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const columns = [
    {
      title: 'Sembol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text, record) => (
        <span>
          {text} {!record.market_open && <Tag color="red">Piyasa Kapalı</Tag>}
        </span>
      ),
    },
    {
      title: 'Fiyat',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Değişim %',
      dataIndex: 'change',
      key: 'change',
      render: (change) => {
        const color = change > 0 ? 'green' : change < 0 ? 'red' : '';
        return <span style={{ color }}>{change > 0 ? '+' : ''}{change.toFixed(2)}%</span>;
      },
    },
    {
      title: 'Hacim',
      dataIndex: 'volume',
      key: 'volume',
      render: (volume) => volume.toLocaleString('tr-TR'),
    },
    {
      title: 'Günlük Yüksek',
      dataIndex: 'high',
      key: 'high',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Günlük Düşük',
      dataIndex: 'low',
      key: 'low',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Son Güncelleme',
      key: 'lastUpdate',
      render: () => lastUpdate ? formatDistanceToNow(lastUpdate, { addSuffix: true, locale: tr }) : '-',
    },
  ];

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5}>Canlı Piyasa Verileri</Title>
          {marketData.length > 0 && !marketData[0].market_open && (
            <Tag color="red">ABD Piyasası Kapalı - Son Kapanış Fiyatları</Tag>
          )}
        </div>
      }
      style={{ marginBottom: 20 }}
    >
      <Table 
        columns={columns} 
        dataSource={marketData} 
        rowKey="symbol"
        pagination={false}
      />
    </Card>
  );
};

export default RealTimeMarket;
