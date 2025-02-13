import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const apiService = {
    getEconomicCalendar: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/economic-calendar`);
            return {
                status: 'success',
                data: response.data
            };
        } catch (error) {
            console.error('Ekonomik takvim verisi alınırken hata:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    },

    getEconomicEvent: async (eventId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/economic-calendar/${eventId}`);
            return {
                status: 'success',
                data: response.data
            };
        } catch (error) {
            console.error('Ekonomik olay detayları alınırken hata:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    },

    getMarketData: async (market) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/market/${market}`);
            return {
                status: 'success',
                data: response.data
            };
        } catch (error) {
            console.error('Piyasa verisi alınırken hata:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    }
};
