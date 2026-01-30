import { toApiError } from '@/api';
import { getHttp } from '../../http';



export const StatsService = {

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
