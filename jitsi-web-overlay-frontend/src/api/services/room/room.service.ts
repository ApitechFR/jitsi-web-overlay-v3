import { getHttp } from '../../http';
import { toApiError } from '@/api/errors';
import { CreateRoomPayload } from './room.types';


export const RoomService = {

    async getByName(roomName: string): Promise<any> {
        try {
            const http = await getHttp();
            const reponse = await http.get(`/rooms/name/${encodeURIComponent(roomName)}`);
            return reponse.data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération de la salle');
        }
    },

    async create(payload: CreateRoomPayload): Promise<any> {
        try {

            const http = await getHttp();
            const reponse = await http.post('/rooms', payload);
            return reponse.data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la création de la salle');
        }
    }

};