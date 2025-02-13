import React, { useEffect, useRef } from 'react';
import './TradingChart.css';

const TradingChart = ({ symbol = 'CRYPTOCAP:BTC.D' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const script = document.createElement('script');
    
    const widgetConfig = {
      "autosize": true,
      "symbol": symbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "tr",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "allow_symbol_change": true,
      "save_image": true,
      "calendar": false,
      "hide_volume": false,
      "support_host": "https://www.tradingview.com"
    };

    try {
      if (container) {
        container.innerHTML = '';
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify(widgetConfig);
        container.appendChild(script);
      }
    } catch (error) {
      console.error("TradingView widget error:", error);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container">
      <div ref={containerRef} className="tradingview-widget-container__widget" />
    </div>
  );
};

export default TradingChart;