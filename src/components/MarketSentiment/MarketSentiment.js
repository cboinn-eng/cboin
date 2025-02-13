import React, { useState, useEffect } from 'react';
import { Card, Spin } from 'antd';
import './MarketSentiment.css';

const MarketSentiment = () => {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runModel = async () => {
      // Simulate model execution with a timeout
      setLoading(true);
      setTimeout(() => {
        // Generate random sentiment values for demonstration purposes
        const randomSentiment = {
          result: Math.random() > 0.5 ? 'Positive' : 'Negative',
          score: (Math.random() * 2 - 1).toFixed(2) // Random score between -1 and 1
        };
        setSentiment(randomSentiment);
        setLoading(false);
      }, 2000);
    };

    // Run the model immediately
    runModel();

    // Set an interval to run the model every 5 minutes (300000 milliseconds)
    const intervalId = setInterval(runModel, 300000);

    // Clear the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card title="Market Sentiment" className="market-sentiment-card">
      {loading ? (
        <Spin />
      ) : (
        <div className="market-sentiment-content">
          <p>
            Duygu Analizi Sonucu:{' '}
            <span className={`sentiment-${sentiment?.result?.toLowerCase()}`}>
              {sentiment ? sentiment.result : 'Veri alınamadı'}
            </span>
          </p>
          <p>
            Market Sentiment:{' '}
            <span className={`sentiment-${sentiment?.score >= 0 ? 'positive' : 'negative'}`}>
              {sentiment ? sentiment.score : 'Veri alınamadı'}
            </span>
          </p>
        </div>
      )}
    </Card>
  );
};

export default MarketSentiment;