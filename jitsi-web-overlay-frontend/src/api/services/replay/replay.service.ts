import { http } from '../../http';
import { toApiError } from '@/api/errors';
import { Replay, ReplayStatus } from './replay.types';


export const ReplayService = {

    async startRecording(body: { conference_name: string, status: ReplayStatus, message: string }) {
        try {
            const { data } = await http.post('/replay/start', body);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors du démarrage de l’enregistrement');
        }
    },

    async getByConfName(conference_name: string) {
        try {
            const { data } = await http.get(`/replays/${encodeURIComponent(conference_name)}`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération du replay');
        }
    },

    async getByConferenceUid(conference_uid: string): Promise<Replay[]> {
        try {
            const { data } = await http.get(`/replays/conference/${conference_uid}`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des replays de la conférence');
        }
    },

    async getAll(): Promise<Record<string, Replay[]>> {
        try {
            const { data } = await http.get('/replays');
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des replays');
        }
    },

    getDownloadUrl(replay_uid: string) {
        try {
            return `${http.defaults.baseURL}/replays/download/${replay_uid}`;
        } catch (error) {
            throw toApiError(error, 'Erreur lors du téléchargement');
        }
    }

};