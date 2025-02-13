import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const aiService = {
    getNewsData: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/news`);
            return {
                status: 'success',
                data: response.data
            };
        } catch (error) {
            console.error('Haber verisi alınırken hata:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    },

    getKapNews: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/kap-news`);
            return {
                status: 'success',
                data: response.data
            };
        } catch (error) {
            console.error('KAP haberleri alınırken hata:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    },

    getAlerts: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/alerts`);
            return {
                status: 'success',
                data: response.data
            };
        } catch (error) {
            console.error('Uyarılar alınırken hata:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    },

    markAlertAsRead: async (alertId) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/alerts/${alertId}/read`);
            return {
                status: 'success',
                data: response.data
            };
        } catch (error) {
            console.error('Uyarı okundu olarak işaretlenirken hata:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    },

    getFearIndexData: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/fear-index`);
            return {
                status: 'success',
                data: response.data
            };
        } catch (error) {
            console.error('Korku endeksi verisi alınırken hata:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    },

    async getLatestSignals() {
        try {
            const response = await axios.get(`${API_BASE_URL}/market/signals`);
            return response.data;
        } catch (error) {
            console.error('Sinyal verileri alınırken hata:', error);
            throw error;
        }
    },

    async getAnalyzedCoins() {
        try {
            const response = await axios.get(`${API_BASE_URL}/market/analyzed-coins`);
            return response.data;
        } catch (error) {
            console.error('Analiz edilen coinler alınırken hata:', error);
            throw error;
        }
    },

    async getPredictions() {
        try {
            const response = await axios.get(`${API_BASE_URL}/market/predictions`);
            return response.data;
        } catch (error) {
            console.error('Tahminler alınırken hata:', error);
            throw error;
        }
    }
};
