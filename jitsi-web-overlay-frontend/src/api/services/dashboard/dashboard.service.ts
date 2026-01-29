
import { toApiError } from '@/api/errors';
import { getHttp } from '../../http';


export const DashboardService = {
    async fetchRealtimeStats() {
        try {
            const http = await getHttp();
            const { data } = await http.get('/stats/realtime');
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des statistiques temps réel');
        }
    },

    async fetchHistoricStats(filter: string) {
        try {
            const http = await getHttp();
            const { data } = await http.get(`/conferences/summary?filter=${filter}`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des statistiques historiques');
        }
    },

    async fetchHistoricStatsByDate(start: string, end: string) {
        try {
            const http = await getHttp();
            const { data } = await http.get(`/conferences/summary?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des statistiques historiques par date');
        }
    },

    async fetchSurveyStats(org: string, filter: string) {
        try {
            const http = await getHttp();
            const { data } = await http.get(`/feedback/statistics/organization/${org}?filter=${filter}`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des résultats de sondage');
        }
    },
    async fetchSurveyTextComments(org: string, question: string, page: number, limit: number, filter?: string, start?: string, end?: string) {
        try {
            const http = await getHttp();
            let url = `/feedback/statistics/organization/${org}/text?label=${encodeURIComponent(question)}&page=${page}&limit=${limit}`;
            if (start && end) {
                url += `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
            } else if (filter) {
                url += `&filter=${filter}`;
            }
            const { data } = await http.get(url);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des commentaires texte');
        }
    },

    async fetchSurveyStatsByDate(org: string, start: string, end: string) {
        try {
            const http = await getHttp();
            const { data } = await http.get(`/feedback/statistics/organization/${org}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des résultats de sondage par date');
        }
    },

    /**
     * generate export URL for survey results
     */
    getExportUrl({ baseUrl, value, dateFilters }: { baseUrl: string, value: string, dateFilters: { startDate: string, endDate: string } }) {
        let url = `${baseUrl.replace(/\/$/, '')}/feedback/export?`;
        if (dateFilters.startDate && dateFilters.endDate) {
            url += `start=${encodeURIComponent(dateFilters.startDate)}&end=${encodeURIComponent(dateFilters.endDate)}`;
        } else {
            url += `filter=${value}`;
        }
        return url;
    }
};

