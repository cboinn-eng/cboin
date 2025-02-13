import React, { useState, useEffect } from 'react';
import './TradeHistory.css';

const TradeHistory = ({ symbol = 'BTCUSDT' }) => {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);

    ws.onmessage = (event) => {
      const trade = JSON.parse(event.data);
      setTrades(prevTrades => {
        const newTrades = [
          {
            id: trade.t,
            price: parseFloat(trade.p),
            quantity: parseFloat(trade.q),
            time: new Date(trade.T),
            isBuyerMaker: trade.m
          },
          ...prevTrades
        ].slice(0, 30); // Son 30 işlemi tut
        return newTrades;
      });
    };

    return () => {
      ws.close();
    };
  }, [symbol]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatNumber = (number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  };

  return (
    <div className="trade-history">
      <div className="trade-history-header">
        <h3>Trade History</h3>
        <span className="symbol">{symbol}</span>
      </div>
      
      <div className="trade-history-content">
        <div className="column-headers">
          <span>Price</span>
          <span>Amount</span>
          <span>Time</span>
        </div>

        <div className="trades">
          {trades.map(trade => (
            <div 
              key={trade.id}
              className={`trade-row ${trade.isBuyerMaker ? 'sell' : 'buy'}`}
            >
              <span className="price">
                {formatNumber(trade.price, 2)}
              </span>
              <span className="quantity">
                {formatNumber(trade.quantity, 4)}
              </span>
              <span className="time">
                {formatTime(trade.time)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;
