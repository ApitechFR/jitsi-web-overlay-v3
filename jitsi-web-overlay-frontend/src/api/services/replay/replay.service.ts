import { http } from '../../http';
import { toApiError } from '@/api/errors';
import { ReplayStatus } from './replay.types';


export const ReplayService = {

    async startRecording(body: { conference_name: string, status: ReplayStatus, message: string }) {
        try {
            const { data } = await http.post('/replay/start', body);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors du démarrage de l’enregistrement');
        }
    },

    async getByConfName(conference_name: string) {
        try {
            const { data } = await http.get(`/replays/${encodeURIComponent(conference_name)}`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération du replay');
        }
    }

};