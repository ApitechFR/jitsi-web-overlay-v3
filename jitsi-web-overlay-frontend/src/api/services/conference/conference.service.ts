import { http } from '../../http';
import { toApiError } from '@/api/errors';
import type { JitsiJwtResponse } from './conference.types';

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
    },

    async jitsiJwt(conference_name: string): Promise<JitsiJwtResponse> {
        try {
            const { data } = await http.post(
                `/conferences/${encodeURIComponent(conference_name)}/tokens/jitsi`,
                {},
                { withCredentials: true }
            );


            const token = data?.token ?? data?.jwt;
            if (!token) {
                throw new Error('Réponse JWT invalide (champ "token" ou "jwt" manquant)');
            }

            return {
                token,
                exp: data?.exp,
                moderator: Boolean(data?.moderator),
            };
        } catch (e) {
            throw toApiError(e, "Échec de récupération du JWT Jitsi");
        }
    }

}
