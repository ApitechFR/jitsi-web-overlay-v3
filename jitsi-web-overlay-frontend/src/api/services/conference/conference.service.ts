import { http } from '../../http';
import { toApiError } from '@/api/errors';
import type { CreateByEmailRes, JitsiJwtResponse, JoinRes } from './conference.types';

export const ConferenceService = {

    async create(payload: { name: string; room_uid: string }) {
        try {
            const { data } = await http.post('/conferences', payload);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la création de la conférence');
        }
    },

    async createByEmail(confName: string, email: string) {
        try {
            const { data } = await http.post<CreateByEmailRes>('conference/create/byemail', { confName, email });
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la création de la conférence par email');
        }
    },


    async join(confName: string) {
        try {
            const { data } = await http.get<JoinRes>(`/${encodeURIComponent(confName)}`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la jonction à la conférence');
        }
    },

    async setEnd(confName: string, endTimeISO: string) {
        try {
            await http.put(`/conferences/${encodeURIComponent(confName)}/end`, { end_time: endTimeISO });
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la clôture de la conférence');
        }
    },

    async getConfSize(confName: string) {
        try {
            const { data } = await http.get(`/conferences/${encodeURIComponent(confName)}/room-size`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération de la taille de la conférence');
        }
    },

    async state(confName: string) {
        try {
            const { data } = await http.get(`/conferences/${encodeURIComponent(confName)}/state`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération de l’état de la conférence');
        }
    },

    async jitsiJwt(confName: string): Promise<JitsiJwtResponse> {
        try {
            const { data } = await http.post(
                `/conferences/${encodeURIComponent(confName)}/tokens/jitsi`,
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
    },


    async getStats() {
        try {
            const { data } = await http.get('/stats/homePage');
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des statistiques');
        }
    }

}
