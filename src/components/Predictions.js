import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Predictions.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Predictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await axios.get('http://localhost:8001/ai/predictions');
        setPredictions(response.data.predictions);
        setError(null);
      } catch (error) {
        console.error('Tahminler alınırken hata:', error);
        setError('Tahminler alınamadı. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
    // Her 5 dakikada bir güncelle
    const interval = setInterval(fetchPredictions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: predictions.map(p => p.date),
    datasets: [
      {
        label: 'Tahmin',
        data: predictions.map(p => p.prediction),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Alt Sınır',
        data: predictions.map(p => p.lower_bound),
        borderColor: 'rgba(255, 99, 132, 0.5)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Üst Sınır',
        data: predictions.map(p => p.upper_bound),
        borderColor: 'rgba(54, 162, 235, 0.5)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Bitcoin Fiyat Tahminleri',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Tahminler yükleniyor...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Tekrar Dene</button>
    </div>
  );

  return (
    <div className="predictions-container">
      <div className="predictions-header">
        <h2>Bitcoin Tahminleri</h2>
        <p className="last-update">Son güncelleme: {new Date().toLocaleString()}</p>
      </div>

      <div className="chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Mevcut Fiyat</th>
              <th>Tahmin</th>
              <th>Alt Sınır</th>
              <th>Üst Sınır</th>
              <th>Değişim %</th>
            </tr>
          </thead>
          <tbody>
            {predictions.slice(0, 10).map((prediction, index) => {
              const changePercent = ((prediction.prediction - prediction.current_price) / prediction.current_price) * 100;
              return (
                <tr key={index}>
                  <td>{prediction.date}</td>
                  <td>${prediction.current_price.toLocaleString()}</td>
                  <td>${prediction.prediction.toLocaleString()}</td>
                  <td>${prediction.lower_bound.toLocaleString()}</td>
                  <td>${prediction.upper_bound.toLocaleString()}</td>
                  <td className={changePercent >= 0 ? 'positive' : 'negative'}>
                    {changePercent.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Predictions;
