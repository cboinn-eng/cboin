import { ENDPOINTS } from '../config/api';

class ApiService {
    async getLatestSignals() {
        try {
            const response = await fetch(ENDPOINTS.SIGNALS.LATEST);
            return await response.json();
        } catch (error) {
            console.error('Error fetching latest signals:', error);
            throw error;
        }
    }

    async startSignalAnalysis() {
        try {
            const response = await fetch(ENDPOINTS.SIGNALS.ANALYZE, {
                method: 'POST',
            });
            return await response.json();
        } catch (error) {
            console.error('Error starting signal analysis:', error);
            throw error;
        }
    }

    async getLatestAiAnalysis() {
        try {
            const response = await fetch(ENDPOINTS.AI.LATEST);
            return await response.json();
        } catch (error) {
            console.error('Error fetching latest AI analysis:', error);
            throw error;
        }
    }

    async startAiAnalysis() {
        try {
            const response = await fetch(ENDPOINTS.AI.ANALYZE, {
                method: 'POST',
            });
            return await response.json();
        } catch (error) {
            console.error('Error starting AI analysis:', error);
            throw error;
        }
    }

    async getAnalysisStatus() {
        try {
            const response = await fetch(ENDPOINTS.STATUS);
            return await response.json();
        } catch (error) {
            console.error('Error fetching analysis status:', error);
            throw error;
        }
    }
}

export default new ApiService();