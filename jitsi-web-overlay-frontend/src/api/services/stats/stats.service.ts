import { toApiError } from '@/api';
import { getHttp } from '../../http';
import { HomeStats } from './stats.types';



export const StatsService = {
    async homePage() {
        try {
            const http = await getHttp();
            const { data } = await http.get<HomeStats>('/stats/homePage');
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des statistiques de la page d\'accueil');
        }
    },

    async realtime() {
        try {
            const http = await getHttp();
            const { data } = await http.get('/stats/realtime');
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des statistiques en temps réel');
        }
    }
};
