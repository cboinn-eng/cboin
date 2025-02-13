import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/aiService';
import { 
    Card, 
    List, 
    Typography, 
    Tag, 
    Tooltip, 
    Spin, 
    Alert as AntAlert, 
    Button, 
    Badge,
    Select,
    Space,
    Radio,
    Input,
    Drawer,
    Switch,
    DatePicker
} from 'antd';
import { 
    BellOutlined,
    InfoCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    FilterOutlined,
    SettingOutlined
} from '@ant-design/icons';
import './Alerts.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Alerts = () => {
    const [data, setData] = useState({ items: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [readAlerts, setReadAlerts] = useState(new Set());
    const [filters, setFilters] = useState({
        priority: 'all',
        category: 'all',
        type: 'all',
        dateRange: null,
        onlyUnread: true
    });
    const [showFilters, setShowFilters] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await aiService.getAlerts();
            if (response.status === 'success') {
                setData(response.data.alerts || { items: [] });
                setError(null);
            } else {
                throw new Error(response.message || 'Veri alınamadı');
            }
        } catch (error) {
            console.error('Uyarı verisi yüklenirken hata:', error);
            setError('Uyarı verileri yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Her dakika güncelle
        return () => clearInterval(interval);
    }, []);

    const markAsRead = (id) => {
        setReadAlerts(prev => new Set([...prev, id]));
    };

    const getAlertTypeColor = (type) => {
        switch (type.toLowerCase()) {
            case 'price':
                return 'blue';
            case 'trend':
                return 'purple';
            case 'volume':
                return 'cyan';
            case 'technical':
                return 'orange';
            case 'news':
                return 'green';
            default:
                return 'default';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high':
                return 'red';
            case 'medium':
                return 'orange';
            case 'low':
                return 'green';
            default:
                return 'default';
        }
    };

    const filterAlerts = (alerts) => {
        return alerts.filter(alert => {
            const matchesPriority = filters.priority === 'all' || alert.priority === filters.priority;
            const matchesCategory = filters.category === 'all' || alert.category === filters.category;
            const matchesType = filters.type === 'all' || alert.type === filters.type;
            const matchesReadStatus = !filters.onlyUnread || !readAlerts.has(alert.id);
            const matchesDate = !filters.dateRange || 
                (new Date(alert.timestamp) >= filters.dateRange[0] && 
                 new Date(alert.timestamp) <= filters.dateRange[1]);

            return matchesPriority && matchesCategory && matchesType && matchesReadStatus && matchesDate;
        });
    };

    if (loading) {
        return (
            <Card className="alerts-card">
                <Spin size="large" />
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="alerts-card">
                <AntAlert message={error} type="error" />
            </Card>
        );
    }

    const filteredAlerts = filterAlerts(data.items);

    return (
        <Card 
            className="alerts-card"
            title={
                <Space>
                    <BellOutlined />
                    <span>Uyarılar</span>
                    <Badge count={filteredAlerts.length} />
                </Space>
            }
            extra={
                <Space>
                    <Button 
                        icon={<FilterOutlined />} 
                        onClick={() => setShowFilters(true)}
                    >
                        Filtreler
                    </Button>
                    <Button 
                        type="primary"
                        onClick={() => fetchData()}
                    >
                        Yenile
                    </Button>
                </Space>
            }
        >
            <List
                dataSource={filteredAlerts}
                renderItem={alert => (
                    <List.Item
                        className={readAlerts.has(alert.id) ? 'read' : ''}
                        actions={[
                            <Button 
                                type="text" 
                                onClick={() => markAsRead(alert.id)}
                                icon={<CheckCircleOutlined />}
                            >
                                Okundu
                            </Button>
                        ]}
                    >
                        <List.Item.Meta
                            title={
                                <Space>
                                    <Tag color={getPriorityColor(alert.priority)}>
                                        {alert.priority.toUpperCase()}
                                    </Tag>
                                    <Tag color={getAlertTypeColor(alert.type)}>
                                        {alert.type}
                                    </Tag>
                                    <Text strong>{alert.title}</Text>
                                </Space>
                            }
                            description={
                                <>
                                    <Text>{alert.message}</Text>
                                    <br />
                                    <Space size="small">
                                        <ClockCircleOutlined />
                                        <Text type="secondary">
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </Text>
                                        <Tag>{alert.category}</Tag>
                                    </Space>
                                </>
                            }
                        />
                    </List.Item>
                )}
            />

            <Drawer
                title="Filtreler"
                placement="right"
                onClose={() => setShowFilters(false)}
                visible={showFilters}
                width={300}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <Text strong>Öncelik</Text>
                        <Select
                            style={{ width: '100%' }}
                            value={filters.priority}
                            onChange={value => setFilters(prev => ({ ...prev, priority: value }))}
                        >
                            <Option value="all">Tümü</Option>
                            <Option value="high">Yüksek</Option>
                            <Option value="medium">Orta</Option>
                            <Option value="low">Düşük</Option>
                        </Select>
                    </div>

                    <div>
                        <Text strong>Kategori</Text>
                        <Select
                            style={{ width: '100%' }}
                            value={filters.category}
                            onChange={value => setFilters(prev => ({ ...prev, category: value }))}
                        >
                            <Option value="all">Tümü</Option>
                            <Option value="crypto">Kripto</Option>
                            <Option value="stock">Hisse</Option>
                            <Option value="forex">Forex</Option>
                            <Option value="commodity">Emtia</Option>
                        </Select>
                    </div>

                    <div>
                        <Text strong>Tip</Text>
                        <Select
                            style={{ width: '100%' }}
                            value={filters.type}
                            onChange={value => setFilters(prev => ({ ...prev, type: value }))}
                        >
                            <Option value="all">Tümü</Option>
                            <Option value="price">Fiyat</Option>
                            <Option value="trend">Trend</Option>
                            <Option value="volume">Hacim</Option>
                            <Option value="technical">Teknik</Option>
                            <Option value="news">Haber</Option>
                        </Select>
                    </div>

                    <div>
                        <Text strong>Tarih Aralığı</Text>
                        <RangePicker
                            style={{ width: '100%' }}
                            onChange={dates => setFilters(prev => ({ ...prev, dateRange: dates }))}
                        />
                    </div>

                    <div>
                        <Space>
                            <Switch
                                checked={filters.onlyUnread}
                                onChange={checked => setFilters(prev => ({ ...prev, onlyUnread: checked }))}
                            />
                            <Text>Sadece Okunmamışları Göster</Text>
                        </Space>
                    </div>

                    <Button 
                        type="primary" 
                        block
                        onClick={() => setFilters({
                            priority: 'all',
                            category: 'all',
                            type: 'all',
                            dateRange: null,
                            onlyUnread: true
                        })}
                    >
                        Filtreleri Sıfırla
                    </Button>
                </Space>
            </Drawer>
        </Card>
    );
};

export default Alerts;
