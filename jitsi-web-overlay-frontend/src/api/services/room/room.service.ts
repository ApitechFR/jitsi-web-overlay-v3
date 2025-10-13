import { http } from '../../http';
import { toApiError } from '@/api/errors';
import { Room } from './room.types';


export const RoomService = {

    async getByName(roomName: string): Promise<Room> {
        try {
            const { data } = await http.get(`/rooms/${encodeURIComponent(roomName)}`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération de la salle');
        }
    },

    async create(roomName: string): Promise<Room> {
        try {

            const existingRoom = await this.getByName(roomName);
            if (existingRoom) {
                return existingRoom;
            }

            const { data } = await http.post('/rooms', { name: roomName });
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la création de la salle');
        }
    }

};