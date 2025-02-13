import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000';

const BitcoinPrediction = () => {
  const [predictions, setPredictions] = useState([]);
  const [latestPrice, setLatestPrice] = useState(null);
  const [modelStatus, setModelStatus] = useState('');

  useEffect(() => {
    // Tahminleri al
    const fetchPredictions = async () => {
      try {
        const response = await axios.get(`${API_URL}/latest-predictions`);
        setPredictions(response.data.predictions || []);
      } catch (error) {
        console.error('Tahminler alınamadı:', error);
      }
    };

    // Model durumunu al
    const fetchModelStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/model-status`);
        setModelStatus(response.data.status);
      } catch (error) {
        console.error('Model durumu alınamadı:', error);
      }
    };

    fetchPredictions();
    fetchModelStatus();

    // Her 5 dakikada bir güncelle
    const interval = setInterval(() => {
      fetchPredictions();
      fetchModelStatus();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Grafik verilerini hazırla
  const chartData = predictions.map(pred => ({
    date: pred.date,
    price: pred.price,
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Bitcoin Fiyat Tahmini
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                Model Durumu: {modelStatus}
              </Typography>
              {chartData.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <LineChart width={800} height={400} data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#8884d8"
                      name="Tahmin Edilen Fiyat"
                    />
                  </LineChart>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tahmin Detayları
              </Typography>
              <Grid container spacing={2}>
                {predictions.map((pred, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary">
                          Tarih: {pred.date}
                        </Typography>
                        <Typography variant="h6">
                          ${pred.price.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BitcoinPrediction;
