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
            const { data } = await http.get(`/replays/${encodeURIComponent(conference_name)}`);
            return data;
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

    async getReplaysByParticipantEmail(email: string): Promise<Record<string, Replay[]>> {
        try {
            const http = await getHttp();
            const { data } = await http.post('/replays/participants/email', { email: email });
            console.log({ data })
            return data;

        } catch (error) {
            throw toApiError(error, 'Erreur lors de la récupération des replays par participant email')
        }
    },

    async getDownloadUrl(replay_uid: string) {
        try {
            const http = await getHttp();
            return `${http.defaults.baseURL}/replays/download/${replay_uid}`;
        } catch (error) {
            throw toApiError(error, 'Erreur lors du téléchargement');
        }
    },

    async downloadReplay(replay_uid: string, filename?: string) {
        const url = await this.getDownloadUrl(replay_uid);
        const response = await fetch(url, {
            credentials: 'include',
        });
        if (!response.ok) {
            throw new Error('Erreur lors du téléchargement : ' + response.statusText);
        }
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = (filename || replay_uid) + '.mp4';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
    }

};