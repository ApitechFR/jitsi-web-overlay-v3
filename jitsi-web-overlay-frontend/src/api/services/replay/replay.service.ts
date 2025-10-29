import { getHttp } from '../../http';
import { toApiError } from '@/api/errors';
import { Replay, ReplayStatus } from './replay.types';


export const ReplayService = {

    async startRecording(body: { conference_name: string, status: ReplayStatus, message: string }) {
        try {
            const http = await getHttp();
            const { data } = await http.post('/replays/start_recording', body);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors du démarrage de l’enregistrement');
        }
    },

    async getByConfName(conference_name: string) {
        try {
            const http = await getHttp();
            const reponse = await http.get(`/replays/${encodeURIComponent(conference_name)}`);
            return reponse.data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération du replay');
        }
    },

    async getByConferenceUid(conference_uid: string): Promise<Replay[]> {
        try {
            const http = await getHttp();
            const { data } = await http.get(`/replays/conference/${conference_uid}`);
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des replays de la conférence');
        }
    },

    async getAll(): Promise<Record<string, Replay[]>> {
        try {
            const http = await getHttp();
            const { data } = await http.get('/replays');
            return data;
        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des replays');
        }
    },

    async getDownloadUrl(replay_uid: string) {
        try {
            const http = await getHttp();
            return `${http.defaults.baseURL}/replays/download/${replay_uid}`;
        } catch (error) {
            throw toApiError(error, 'Erreur lors du téléchargement');
        }
    }

};