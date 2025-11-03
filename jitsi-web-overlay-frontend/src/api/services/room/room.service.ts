import { getHttp } from '../../http';
import { toApiError } from '@/api/errors';


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

    async create(roomName: string): Promise<any> {
        try {

            const http = await getHttp();
            const reponse = await http.post('/rooms', { name: roomName });
            return reponse.data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la création de la salle');
        }
    }

};