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

    async getById(id: number): Promise<Participant> {
        try {
            const http = await getHttp();
            const { data } = await http.get(`/participants/${id}`);
            return data;
        } catch (error) {
            throw toApiError(error, `Erreur lors de la récupération du participant #${id}`);
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

    async update(id: number, payload: UpdateParticipantDto): Promise<Participant> {
        try {
            const http = await getHttp();
            const { data } = await http.patch(`/participants/${id}`, payload);
            return data;
        } catch (error) {
            throw toApiError(error, `Erreur lors de la mise à jour du participant #${id}`);
        }
    },
};