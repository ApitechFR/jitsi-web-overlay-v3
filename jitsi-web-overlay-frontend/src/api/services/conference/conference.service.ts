import { http } from '../../http';
import { toApiError } from '@/api/errors';

export const ConferenceService = {

    async create(payload: { name: string; room_uid: string }) {
        try {
            const { data } = await http.post('/conferences', payload);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la création de la conférence');
        }
    },

    async setEnd(conference_name: string, endTimeISO: string) {
        try {
            await http.put(`/conferences/${encodeURIComponent(conference_name)}/end`, { end_time: endTimeISO });
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la clôture de la conférence');
        }
    },

    async getConfSize(conference_name: string) {
        try {
            const { data } = await http.get(`/conferences/${encodeURIComponent(conference_name)}/room-size`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération de la taille de la conférence');
        }
    },

    async state(conference_name: string) {
        try {
            const { data } = await http.get(`/conferences/${encodeURIComponent(conference_name)}/state`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération de l’état de la conférence');
        }
    }
}
