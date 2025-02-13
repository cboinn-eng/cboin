import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  StockOutlined, 
  DollarCircleOutlined, 
  GlobalOutlined,
  GoldOutlined
} from '@ant-design/icons';
import './MarketStatus.css';

const MarketStatus = () => {
  const [markets, setMarkets] = useState([
    { 
      name: 'Kripto', 
      status: 'open', 
      icon: <GlobalOutlined className="market-icon" />,
      isActive: true,
      type: 'crypto'
    },
    { 
      name: 'BIST', 
      status: 'closed', 
      icon: <StockOutlined className="market-icon" />,
      isActive: false,
      type: 'bist'
    },
    { 
      name: 'NASDAQ', 
      status: 'open', 
      icon: <DollarCircleOutlined className="market-icon" />,
      isActive: true,
      type: 'nasdaq'
    },
    { 
      name: 'Emtia', 
      status: 'open', 
      icon: <GoldOutlined className="market-icon" />,
      isActive: true,
      type: 'commodities'
    }
  ]);

  // BIST 2025 resmi tatil günleri
  const bistHolidays2025 = useMemo(() => [
    '2025-01-01', // Yılbaşı
    '2025-03-30', // Ramazan Bayramı 1. Gün
    '2025-03-31', // Ramazan Bayramı 2. Gün
    '2025-04-01', // Ramazan Bayramı 3. Gün
    '2025-04-23', // Ulusal Egemenlik ve Çocuk Bayramı
    '2025-05-01', // Emek ve Dayanışma Günü
    '2025-05-19', // Atatürk'ü Anma, Gençlik ve Spor Bayramı
    '2025-06-06', // Kurban Bayramı 1. Gün
    '2025-06-07', // Kurban Bayramı 2. Gün
    '2025-06-08', // Kurban Bayramı 3. Gün
    '2025-06-09', // Kurban Bayramı 4. Gün
    '2025-07-15', // Demokrasi ve Milli Birlik Günü
    '2025-08-30', // Zafer Bayramı
    '2025-10-29', // Cumhuriyet Bayramı
  ], []);

  // NASDAQ 2025 resmi tatil günleri
  const nasdaqHolidays2025 = useMemo(() => [
    '2025-01-01', // New Year's Day
    '2025-01-20', // Martin Luther King Jr. Day
    '2025-02-17', // Presidents Day
    '2025-04-18', // Good Friday
    '2025-05-26', // Memorial Day
    '2025-06-19', // Juneteenth
    '2025-07-04', // Independence Day
    '2025-09-01', // Labor Day
    '2025-11-27', // Thanksgiving Day
    '2025-12-25', // Christmas Day
  ], []);

  // BIST Yarım gün çalışılan günler
  const bistHalfDays2025 = useMemo(() => [
    '2025-03-29', // Ramazan Bayramı Arifesi
    '2025-06-05', // Kurban Bayramı Arifesi
    '2025-10-28', // Cumhuriyet Bayramı Arifesi
  ], []);

  const isBistHoliday = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bistHolidays2025.includes(dateStr);
  }, [bistHolidays2025]);

  const isNasdaqHoliday = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    return nasdaqHolidays2025.includes(dateStr);
  }, [nasdaqHolidays2025]);

  const isBistHalfDay = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bistHalfDays2025.includes(dateStr);
  }, [bistHalfDays2025]);

  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      const minute = now.getMinutes();

      // Hafta sonu kontrolü
      const isWeekend = day === 0 || day === 6;
      
      // BIST tatil günü kontrolü
      const isBistHolidayToday = isBistHoliday(now);
      const isBistHalfDayToday = isBistHalfDay(now);

      // NASDAQ tatil günü kontrolü
      const isNasdaqHolidayToday = isNasdaqHoliday(now);

      // BIST: Hafta içi 10:00-18:00 (Yarım günlerde 10:00-13:00)
      let bistStatus = 'closed';
      if (!isWeekend && !isBistHolidayToday) {
        if (isBistHalfDayToday) {
          if ((hour === 10 && minute >= 0) || (hour > 10 && hour < 13) || (hour === 13 && minute === 0)) {
            bistStatus = 'half';
          }
        } else if ((hour === 10 && minute >= 0) || (hour > 10 && hour < 18) || (hour === 18 && minute === 0)) {
          bistStatus = 'open';
        }
      }
      
      // NASDAQ: Normal günler 16:30-23:00 (TR saati)
      let nasdaqStatus = 'closed';
      if (!isWeekend && !isNasdaqHolidayToday) {
        if ((hour === 16 && minute >= 30) || (hour > 16 && hour < 23) || (hour === 23 && minute === 0)) {
          nasdaqStatus = 'open';
        }
      }

      setMarkets(prev => prev.map(market => {
        switch(market.type) {
          case 'crypto':
            return { ...market, status: 'open', isActive: true };
          case 'bist':
            return { ...market, status: bistStatus, isActive: bistStatus !== 'closed' };
          case 'nasdaq':
            return { ...market, status: nasdaqStatus, isActive: nasdaqStatus === 'open' };
          case 'commodities':
            return { ...market, status: !isWeekend && !isBistHolidayToday ? 'open' : 'closed', isActive: !isWeekend && !isBistHolidayToday };
          default:
            return market;
        }
      }));
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Her dakika kontrol et
    return () => clearInterval(interval);
  }, [isBistHoliday, isNasdaqHoliday, isBistHalfDay]);

  const getStatusText = (market) => {
    if (market.type === 'crypto') return '24/7 Açık';
    
    switch (market.status) {
      case 'open':
        return 'Açık';
      case 'closed':
        return 'Kapalı';
      case 'half':
        return 'Yarım Gün';
      default:
        return market.status;
    }
  };

  return (
    <div className="market-status-container">
      {markets.map((market, index) => (
        <div 
          key={index} 
          className={`market-status-item ${market.isActive ? 'active' : ''}`}
        >
          <div className="market-name">
            {market.icon}
            {market.name}
          </div>
          <div className={`status-badge ${market.status}`}>
            {getStatusText(market)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarketStatus;
