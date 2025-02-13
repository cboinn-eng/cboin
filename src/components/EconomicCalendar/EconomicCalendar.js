import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Table, 
    Tag, 
    Space, 
    Statistic, 
    Row, 
    Col,
    Select,
    DatePicker,
    Button,
    Badge
} from 'antd';
import { 
    CalendarOutlined,
    GlobalOutlined,
    ExclamationCircleOutlined,
    SyncOutlined,
    RiseOutlined,
    FallOutlined
} from '@ant-design/icons';
import { apiService } from '../../services/apiService';
import moment from 'moment';
import './EconomicCalendar.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 2025 Takvim Verileri
const calendarEvents2025 = [
    // Ocak 2025
    {
        date: '2025-01-01',
        title: 'Yılbaşı',
        type: 'holiday',
        importance: 'high',
        description: 'Resmi tatil'
    },
    {
        date: '2025-01-10',
        title: 'G20 Maliye Bakanları Toplantısı',
        type: 'economic',
        importance: 'high',
        description: 'G20 ülkeleri maliye bakanları ve merkez bankası başkanları toplantısı'
    },
    // Mart 2025
    {
        date: '2025-03-10',
        title: 'Ramazan Başlangıcı',
        type: 'religious',
        importance: 'high',
        description: 'Ramazan ayının ilk günü'
    },
    {
        date: '2025-03-15',
        title: 'G20 Dijital Ekonomi Toplantısı',
        type: 'economic',
        importance: 'high',
        description: 'G20 Dijital Ekonomi Çalışma Grubu Toplantısı'
    },
    // Nisan 2025
    {
        date: '2025-04-09',
        title: 'Ramazan Bayramı (1. Gün)',
        type: 'religious',
        importance: 'high',
        description: 'Resmi tatil'
    },
    {
        date: '2025-04-10',
        title: 'Ramazan Bayramı (2. Gün)',
        type: 'religious',
        importance: 'high',
        description: 'Resmi tatil'
    },
    {
        date: '2025-04-11',
        title: 'Ramazan Bayramı (3. Gün)',
        type: 'religious',
        importance: 'high',
        description: 'Resmi tatil'
    },
    {
        date: '2025-04-23',
        title: 'Ulusal Egemenlik ve Çocuk Bayramı',
        type: 'holiday',
        importance: 'high',
        description: 'Resmi tatil'
    },
    // Mayıs 2025
    {
        date: '2025-05-01',
        title: 'Emek ve Dayanışma Günü',
        type: 'holiday',
        importance: 'high',
        description: 'Resmi tatil'
    },
    {
        date: '2025-05-19',
        title: 'Atatürkü Anma, Gençlik ve Spor Bayramı',
        type: 'holiday',
        importance: 'high',
        description: 'Resmi tatil'
    },
    // Haziran 2025
    {
        date: '2025-06-15',
        title: 'Kurban Bayramı (1. Gün)',
        type: 'religious',
        importance: 'high',
        description: 'Resmi tatil'
    },
    {
        date: '2025-06-16',
        title: 'Kurban Bayramı (2. Gün)',
        type: 'religious',
        importance: 'high',
        description: 'Resmi tatil'
    },
    {
        date: '2025-06-17',
        title: 'Kurban Bayramı (3. Gün)',
        type: 'religious',
        importance: 'high',
        description: 'Resmi tatil'
    },
    {
        date: '2025-06-18',
        title: 'Kurban Bayramı (4. Gün)',
        type: 'religious',
        importance: 'high',
        description: 'Resmi tatil'
    },
    {
        date: '2025-06-25',
        title: 'G20 Zirvesi',
        type: 'economic',
        importance: 'high',
        description: 'G20 Liderler Zirvesi'
    },
    // Temmuz 2025
    {
        date: '2025-07-15',
        title: 'Demokrasi ve Milli Birlik Günü',
        type: 'holiday',
        importance: 'high',
        description: 'Resmi tatil'
    },
    // Ağustos 2025
    {
        date: '2025-08-30',
        title: 'Zafer Bayramı',
        type: 'holiday',
        importance: 'high',
        description: 'Resmi tatil'
    },
    // Ekim 2025
    {
        date: '2025-10-29',
        title: 'Cumhuriyet Bayramı',
        type: 'holiday',
        importance: 'high',
        description: 'Resmi tatil'
    },
    // Kasım 2025
    {
        date: '2025-11-15',
        title: 'G20 Ekonomi Zirvesi',
        type: 'economic',
        importance: 'high',
        description: 'G20 Ekonomi ve Finans Bakanları Toplantısı'
    }
];

const EconomicCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        type: 'all',
        dateRange: [moment().startOf('day'), moment().endOf('day')]
    });

    useEffect(() => {
        loadEvents();
    }, [filters]);

    const loadEvents = () => {
        const filteredEvents = calendarEvents2025.filter(event => {
            const eventDate = moment(event.date);
            const matchesType = filters.type === 'all' || event.type === filters.type;
            const matchesDate = eventDate.isBetween(filters.dateRange[0], filters.dateRange[1], 'day', '[]');
            return matchesType && matchesDate;
        });

        // Tarihe göre azalan sırada sırala (en yeniden en eskiye)
        const sortedEvents = filteredEvents.sort((a, b) => {
            return moment(b.date).valueOf() - moment(a.date).valueOf();
        });

        setEvents(sortedEvents);
    };

    const getStats = () => {
        const now = moment();
        return {
            total: calendarEvents2025.length,
            highImpact: calendarEvents2025.filter(event => event.importance === 'high').length,
            upcoming: calendarEvents2025.filter(event => moment(event.date).isAfter(now)).length
        };
    };

    const stats = getStats();

    const columns = [
        {
            title: 'Tarih',
            dataIndex: 'date',
            key: 'date',
            render: date => moment(date).format('DD.MM.YYYY'),
            defaultSortOrder: 'descend',
            sorter: (a, b) => moment(b.date).valueOf() - moment(a.date).valueOf()
        },
        {
            title: 'Başlık',
            dataIndex: 'title',
            key: 'title'
        },
        {
            title: 'Tür',
            dataIndex: 'type',
            key: 'type',
            filters: [
                { text: 'Ekonomik', value: 'economic' },
                { text: 'Dini', value: 'religious' },
                { text: 'Resmi Tatil', value: 'holiday' }
            ],
            onFilter: (value, record) => record.type === value,
            render: type => {
                const colors = {
                    economic: 'blue',
                    religious: 'purple',
                    holiday: 'green'
                };
                const labels = {
                    economic: 'Ekonomik',
                    religious: 'Dini',
                    holiday: 'Resmi Tatil'
                };
                return <Tag color={colors[type]}>{labels[type]}</Tag>;
            }
        },
        {
            title: 'Açıklama',
            dataIndex: 'description',
            key: 'description'
        }
    ];

    return (
        <div className="economic-calendar">
            <Card
                className="calendar-card"
                title={
                    <div className="calendar-header">
                        <div className="header-left">
                            <CalendarOutlined className="header-icon" />
                            <span className="header-title">Ekonomik Takvim</span>
                        </div>
                    </div>
                }
                bordered={false}
            >
                {/* Investing.com Economic Calendar Widget */}
                <div className="investing-calendar-container">
                    <div className="investing-calendar-wrapper">
                        <iframe 
                            src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=5,17,25,143,4,37,72,22,110,14,21,39,26,12,10,35,6,56,36,63,43&calType=week&timeZone=63&lang=10" 
                            width="100%" 
                            height="467" 
                            frameBorder="0" 
                            allowtransparency="true" 
                            marginWidth="0" 
                            marginHeight="0"
                            className="calendar-iframe"
                        ></iframe>
                    </div>
                    <div className="poweredBy">
                        <span>Canlı Ekonomik Takvim <a href="https://tr.investing.com/" rel="nofollow" target="_blank" className="underline_link">Investing.com Türkiye</a> tarafından sağlanmaktadır.</span>
                    </div>
                </div>

                <div className="custom-calendar-section">
                    <div className="section-header">
                        <h3>2025 Önemli Günler ve Olaylar</h3>
                    </div>

                    <div className="calendar-stats">
                        <Row gutter={[24, 24]}>
                            <Col xs={24} sm={8}>
                                <Card className="stat-card total-events">
                                    <Statistic
                                        title="Toplam Olay"
                                        value={stats.total}
                                        prefix={<CalendarOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Card className="stat-card high-impact">
                                    <Statistic
                                        title="Yüksek Önemli"
                                        value={stats.highImpact}
                                        valueStyle={{ color: '#ff4d4f' }}
                                        prefix={<ExclamationCircleOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Card className="stat-card upcoming">
                                    <Statistic
                                        title="Yaklaşan"
                                        value={stats.upcoming}
                                        valueStyle={{ color: '#1890ff' }}
                                        prefix={<SyncOutlined />}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </div>

                    <Row gutter={16} className="filters-container">
                        <Col span={12}>
                            <Select
                                style={{ width: '100%' }}
                                value={filters.type}
                                onChange={value => setFilters({ ...filters, type: value })}
                            >
                                <Option value="all">Tüm Etkinlikler</Option>
                                <Option value="economic">Ekonomik</Option>
                                <Option value="religious">Dini</Option>
                                <Option value="holiday">Resmi Tatil</Option>
                            </Select>
                        </Col>
                        <Col span={12}>
                            <RangePicker
                                style={{ width: '100%' }}
                                value={filters.dateRange}
                                onChange={dates => setFilters({ ...filters, dateRange: dates })}
                            />
                        </Col>
                    </Row>

                    <Table
                        dataSource={events}
                        columns={columns}
                        rowKey="date"
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: false,
                            defaultCurrent: 1
                        }}
                        className="events-table"
                        onChange={(pagination, filters, sorter) => {
                            // Sıralama değiştiğinde çalışacak
                            if (sorter.order) {
                                const sortedEvents = [...events].sort((a, b) => {
                                    return sorter.order === 'descend' 
                                        ? moment(b.date).valueOf() - moment(a.date).valueOf()
                                        : moment(a.date).valueOf() - moment(b.date).valueOf();
                                });
                                setEvents(sortedEvents);
                            }
                        }}
                    />
                </div>
            </Card>
        </div>
    );
};

export default EconomicCalendar;
