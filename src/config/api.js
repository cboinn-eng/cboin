export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000';

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
        NEWS: `${API_BASE_URL}/market/crypto-news`,
        STATS: `${API_BASE_URL}/market/stats`,
        PRICE_HISTORY: `${API_BASE_URL}/price/history`
    },
    AI: {
        START_MODEL: `${API_BASE_URL}/ai/model/sarima`,
        STOP_MODEL: `${API_BASE_URL}/ai/model/stop`,
        PREDICTIONS: `${API_BASE_URL}/ai/predictions`,
        MODEL_STATUS: `${API_BASE_URL}/ai/model-status`
    },
    SOCIAL: {
        TWITTER: `${API_BASE_URL}/social/twitter/recent-tweets`,
        TWITTER_ANALYSIS: `${API_BASE_URL}/social/twitter/analysis`
    }
};
