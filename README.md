# Cboin Trading Bot

Kripto para piyasalarını takip eden ve analiz eden bir trading bot uygulaması.

## Özellikler

- Canlı fiyat takibi
- Teknik analiz göstergeleri
- Twitter duygu analizi
- Piyasa haberleri
- Fiyat tahminleri
- Portföy yönetimi

## Kurulum

1. Repository'yi klonlayın:
```bash
git clone https://github.com/[username]/cboin.git
cd cboin
```

2. Backend için gerekli paketleri yükleyin:
```bash
cd backend
pip install -r requirements.txt
```

3. Frontend için gerekli paketleri yükleyin:
```bash
cd ../frontend
npm install
```

4. Gerekli API anahtarlarını ayarlayın:
- CRYPTOCOMPARE_API_KEY
- BINANCE_API_KEY
- BINANCE_API_SECRET

5. Backend'i başlatın:
```bash
cd backend
python server.py
```

6. Frontend'i başlatın:
```bash
cd frontend
npm start
```

## Teknolojiler

### Backend
- Python
- FastAPI
- WebSocket
- Binance API
- CryptoCompare API

### Frontend
- React
- Ant Design
- Recharts
- Axios

## Lisans

MIT
