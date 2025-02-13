export const API_BASE_URL = 'http://localhost:8001';

export const ENDPOINTS = {
    MARKET: {
        EMTIA: `${API_BASE_URL}/market/emtia`,
        NASDAQ: `${API_BASE_URL}/market/nasdaq`,
        CRYPTO: `${API_BASE_URL}/market/crypto`,
        BIST100: `${API_BASE_URL}/market/bist100`,
        NASDAQMARKET: `${API_BASE_URL}/market/nasdaq-data`,
        COMMODITIES: `${API_BASE_URL}/market/commodities`,
        SIGNALS: `${API_BASE_URL}/market/signals`,
        PREDICTIONS: `${API_BASE_URL}/ai/predictions`,
        PREDICTIONS_UPDATE: `${API_BASE_URL}/ai/predictions/update`,
        ANALYZED_COINS: `${API_BASE_URL}/market/analyzed-coins`,
        NEWS: `${API_BASE_URL}/market/crypto-news`  // Endpoint güncellendi
    }
};
