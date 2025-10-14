import { toApiError } from '@/api';
import { http } from '../../http';
import { HomeStats } from './stats.types';



export const StatsService = {
    async homePage() {
        try {
            const { data } = await http.get<HomeStats>('/stats/homePage');
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des statistiques de la page d\'accueil');
        }
    },
};
