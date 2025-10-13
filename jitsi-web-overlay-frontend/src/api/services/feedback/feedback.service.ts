import { toApiError } from '@/api/errors';
import { http } from '../../http';
import { FeedbackTemplate, CreateFeedbackDTO } from './feedback.types';



export const FeedbackService = {

    async listTemplates(): Promise<FeedbackTemplate[]> {

        try {
            const { data } = await http.get('/feedback/templates');
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des templates de feedback');
        }

    },

    async bulkCreate(payload: CreateFeedbackDTO[]): Promise<void> {
        try {
            await http.post('/feedback/internal/bulk', payload);
        } catch (error) {
            throw toApiError(error, 'Échec envoi des feedbacks au serveur');
        }
    },
};
