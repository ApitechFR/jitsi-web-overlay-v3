import { getHttp } from '../../http';
import { toApiError } from '@/api/errors';

export interface WebinarInvitationResponse {
    roomName: string;
    jwt: string;
    type: string;
}

export const WebinarService = {
    async getInvitation(token: string): Promise<WebinarInvitationResponse> {
        try {
            const http = await getHttp();
            const { data } = await http.get(`/webinar/invite/${encodeURIComponent(token)}`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération de l\'invitation webinar');
        }
    },
};
