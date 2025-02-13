import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Tag, Tooltip, Space, Select, DatePicker } from 'antd';
import { 
    CalendarOutlined, 
    BankOutlined, 
    GlobalOutlined,
    WarningOutlined,
    FlagOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { economicCalendar2025 } from '../../data/economic-calendar-2025';
import styles from './EconomicAlerts.module.css';

const { Title, Text } = Typography;
const { Option } = Select;

const EconomicAlerts = () => {
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

    const calculateDaysUntil = (date) => {
        const eventDate = new Date(date);
        const today = new Date();
        const diffTime = eventDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const sortEventsByDate = (events) => {
        return events.sort((a, b) => {
            const daysUntilA = calculateDaysUntil(a.date);
            const daysUntilB = calculateDaysUntil(b.date);
            return daysUntilA - daysUntilB;
        });
    };

    useEffect(() => {
        filterEvents();
    }, [selectedCountries, selectedTypes, selectedDate]);

    const filterEvents = () => {
        let events = economicCalendar2025.events;

        // Geçmiş olayları filtrele
        events = events.filter(event => calculateDaysUntil(event.date) >= 0);

        if (selectedCountries.length > 0) {
            events = events.filter(event => 
                event.countries.some(country => 
                    selectedCountries.includes(country) || 
                    event.countries.includes('All G20')
                )
            );
        }

        if (selectedTypes.length > 0) {
            events = events.filter(event => selectedTypes.includes(event.type));
        }

        if (selectedDate) {
            const selectedMonth = selectedDate.month();
            const selectedYear = selectedDate.year();
            events = events.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getMonth() === selectedMonth && 
                       eventDate.getFullYear() === selectedYear;
            });
        }

        // Tarihe göre sırala
        const sortedEvents = sortEventsByDate(events);
        setFilteredEvents(sortedEvents);
    };

    const getEventIcon = (type) => {
        switch (type) {
            case 'religious':
                return <GlobalOutlined />;
            case 'economic':
                return <BankOutlined />;
            case 'national':
                return <FlagOutlined />;
            default:
                return <CalendarOutlined />;
        }
    };

    const getImpactColor = (impact) => {
        switch (impact) {
            case 'critical':
                return 'error';
            case 'high':
                return 'warning';
            case 'medium':
                return 'processing';
            default:
                return 'default';
        }
    };

    const getDaysUntilText = (date) => {
        const days = calculateDaysUntil(date);
        if (days === 0) return 'Bugün';
        if (days === 1) return 'Yarın';
        return `${days} gün sonra`;
    };

    const renderEventItem = (event) => {
        const daysUntil = calculateDaysUntil(event.date);
        const isUpcoming = daysUntil <= 7; // 7 gün veya daha az kaldıysa yaklaşan olay

        return (
            <List.Item 
                className={`${styles.eventItem} ${isUpcoming ? styles.upcomingEvent : ''}`} 
                data-impact={event.impact}
            >
                <div className={styles.eventBadge}>
                    {getEventIcon(event.type)}
                </div>
                <div className={styles.eventContent}>
                    <div className={styles.eventHeader}>
                        <Text className={styles.eventName}>
                            {event.name}
                        </Text>
                        <Space size={4}>
                            <Tag className={`${styles.impactTag} ${styles[event.impact]}`}>
                                {event.impact}
                            </Tag>
                            <Tag icon={<ClockCircleOutlined />} className={styles.dateTag}>
                                {getDaysUntilText(event.date)}
                            </Tag>
                            <Text className={styles.dateInfo}>
                                {new Date(event.date).toLocaleDateString('tr-TR')}
                            </Text>
                        </Space>
                    </div>
                    {event.description && (
                        <Text className={styles.description}>
                            {event.description}
                        </Text>
                    )}
                    <div className={styles.countries}>
                        {event.countries?.map(country => (
                            <Tag key={country} className={styles.countryTag}>
                                {country}
                            </Tag>
                        ))}
                    </div>
                    {event.duration && (
                        <Text className={styles.duration}>
                            Duration: {event.duration}
                        </Text>
                    )}
                </div>
            </List.Item>
        );
    };

    return (
        <div className={styles.calendarCard}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <CalendarOutlined className={styles.headerIcon} />
                    <Title level={4}>CBOIN Economy / Market Events 2025</Title>
                </div>
                <div className={styles.filters}>
                    <Select
                        mode="multiple"
                        style={{ width: '200px' }}
                        placeholder="Select countries"
                        onChange={setSelectedCountries}
                    >
                        {economicCalendar2025.countries.map(country => (
                            <Option key={country.name} value={country.name}>
                                {country.name}
                            </Option>
                        ))}
                    </Select>
                    <Select
                        mode="multiple"
                        style={{ width: '200px' }}
                        placeholder="Select event types"
                        onChange={setSelectedTypes}
                    >
                        {Object.keys(economicCalendar2025.categories).map(type => (
                            <Option key={type} value={type}>
                                {economicCalendar2025.categories[type]}
                            </Option>
                        ))}
                    </Select>
                    <DatePicker.MonthPicker 
                        onChange={setSelectedDate}
                        placeholder="Select month"
                    />
                </div>
            </div>
            <List
                className={styles.eventsList}
                dataSource={filteredEvents}
                renderItem={renderEventItem}
            />
            <div className={styles.footer}>
                <Text>Toplam: {filteredEvents.length} olay</Text>
                <Text type="secondary">
                    Not: Yaklaşan olaylar (7 gün veya daha az) vurgulanmıştır
                </Text>
            </div>
        </div>
    );
};

export default EconomicAlerts;
