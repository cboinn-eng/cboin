import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import axios from 'axios';
import { ENDPOINTS } from '../../config/api';
import './Dashboard.css';

const { Title } = Typography;

const EmtiaMarket = () => {
    const [emtiaData, setEmtiaData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEmtiaData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(ENDPOINTS.MARKET.EMTIA);
            if (response.data && Array.isArray(response.data)) {
                setEmtiaData(response.data);
            } else {
                setEmtiaData([]);
                message.error('Emtia verileri geçersiz format');
            }
        } catch (error) {
            console.error('Emtia verileri alınamadı:', error);
            message.error('Emtia verileri alınamadı');
            setEmtiaData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmtiaData();
        const interval = setInterval(fetchEmtiaData, 60000);
        return () => clearInterval(interval);
    }, []);

    const columns = [
        {
            title: 'Sembol',
            dataIndex: 'symbol',
            key: 'symbol',
            render: (text) => <span className="symbol-cell">{text}</span>
        },
        {
            title: 'İsim',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Fiyat',
            dataIndex: 'price',
            key: 'price',
            render: (price) => (
                <span className="price-cell">
                    ${price?.toFixed(2)}
                </span>
            )
        },
        {
            title: 'Değişim',
            dataIndex: 'change',
            key: 'change',
            render: (change, record) => {
                const isPositive = record.changePercent >= 0;
                return (
                    <span className={`change-tag ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        {' '}
                        {Math.abs(change).toFixed(2)} ({Math.abs(record.changePercent).toFixed(2)}%)
                    </span>
                );
            }
        },
        {
            title: 'Hacim',
            dataIndex: 'volume',
            key: 'volume',
            render: (volume) => (
                <span className="volume-cell">
                    {volume?.toLocaleString()}
                </span>
            )
        }
    ];

    return (
        <Card 
            title="Emtia Piyasası"
            className="market-card"
            bordered={false}
        >
            <Table
                dataSource={emtiaData}
                columns={columns}
                rowKey="symbol"
                loading={loading}
                pagination={false}
                size="middle"
                scroll={{ y: 400 }}
            />
        </Card>
    );
};

export default EmtiaMarket;
