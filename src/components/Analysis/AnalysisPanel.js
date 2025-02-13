import React, { useState, useEffect } from 'react';
import apiService from '../../utils/apiService';

const AnalysisPanel = () => {
    const [signals, setSignals] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [status, setStatus] = useState({ signals_status: 'idle', ai_status: 'idle' });
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [signalsData, aiData, statusData] = await Promise.all([
                apiService.getLatestSignals(),
                apiService.getLatestAiAnalysis(),
                apiService.getAnalysisStatus()
            ]);
            
            setSignals(signalsData);
            setAiAnalysis(aiData);
            setStatus(statusData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
        // Her 30 saniyede bir güncelle
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const startAnalysis = async (type) => {
        setLoading(true);
        try {
            if (type === 'signals') {
                await apiService.startSignalAnalysis();
            } else {
                await apiService.startAiAnalysis();
            }
            await fetchData();
        } catch (error) {
            console.error('Error starting analysis:', error);
        }
        setLoading(false);
    };

    return (
        <div className="analysis-panel">
            <div className="status-section">
                <h2>Analiz Durumu</h2>
                <div className="status-indicators">
                    <div className={`status-item ${status.signals_status}`}>
                        Sinyal Analizi: {status.signals_status}
                    </div>
                    <div className={`status-item ${status.ai_status}`}>
                        AI Analizi: {status.ai_status}
                    </div>
                </div>
            </div>

            <div className="controls-section">
                <button 
                    onClick={() => startAnalysis('signals')}
                    disabled={loading || status.signals_status === 'running'}
                >
                    Sinyal Analizi Başlat
                </button>
                <button 
                    onClick={() => startAnalysis('ai')}
                    disabled={loading || status.ai_status === 'running'}
                >
                    AI Analizi Başlat
                </button>
            </div>

            <div className="results-section">
                {signals && (
                    <div className="signals-results">
                        <h3>Son Sinyal Sonuçları</h3>
                        <pre>{JSON.stringify(signals, null, 2)}</pre>
                    </div>
                )}

                {aiAnalysis && (
                    <div className="ai-results">
                        <h3>Son AI Analiz Sonuçları</h3>
                        <pre>{JSON.stringify(aiAnalysis, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisPanel;
