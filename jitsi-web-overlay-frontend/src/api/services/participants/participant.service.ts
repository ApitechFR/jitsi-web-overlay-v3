import { getHttp } from '@/api/http';
import { toApiError } from '@/api/errors';
import { CreateParticipantDto, Participant, UpdateParticipantDto } from './participants.types';

export const ParticipantService = {

    async list(): Promise<Participant[]> {
        try {
            const http = await getHttp();
            const { data } = await http.get('/participants');
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des participants');
        }
    },

    async getByUID(uid: number): Promise<Participant> {
        try {
            const http = await getHttp();
            const { data } = await http.get(`/participants/${uid}`);
            return data;
        } catch (error) {
            throw toApiError(error, `Erreur lors de la récupération du participant #${uid}`);
        }
    },

    async create(payload: CreateParticipantDto): Promise<Participant> {
        try {
            const http = await getHttp();
            const { data } = await http.post('/participants', payload);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la création du participant');
        }
    },

    async update(uid: number, payload: UpdateParticipantDto): Promise<Participant> {
        try {
            const http = await getHttp();
            const { data } = await http.patch(`/participants/${uid}`, payload);
            return data;
        } catch (error) {
            throw toApiError(error, `Erreur lors de la mise à jour du participant #${uid}`);
        }
    },
};