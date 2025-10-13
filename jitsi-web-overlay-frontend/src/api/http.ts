
/****
 ** Fichier de configuration d'axios pour les requêtes HTTP.
 ** Gère automatiquement le rafraîchissement des tokens d'authentification.
 ****/


import axios from 'axios';
import { ApiError } from './errors';

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
    headers: { Accept: 'application/json' },
});

let refreshing = false;
let waiters: Array<() => void> = [];

http.interceptors.response.use(
    r => r,
    async (error) => {
        const { response, config } = error || {};
        if (!response) {
            throw new ApiError('Réseau indisponible', undefined, error?.message);
        }
        if (response.status !== 401 || config?.__isRetry) {

            throw new ApiError(
                response?.data?.message || 'Le serveur a rencontré une erreur',
                response.status,
                response.data
            );
        }

        try {
            if (refreshing) {
                await new Promise<void>(res => waiters.push(res));
            } else {
                refreshing = true;
                await http.get('/authentication/refreshToken');
                refreshing = false;
                waiters.forEach(w => w()); waiters = [];
            }
            return http.request({ ...config, __isRetry: true });
        } catch (e: any) {
            refreshing = false; waiters = [];
            throw new ApiError('Session expirée', 401, e?.response?.data ?? e?.message);
        }
    }
);
