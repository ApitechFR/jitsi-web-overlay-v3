
/****
 ** Fichier de configuration d'axios pour les requêtes HTTP.
 ** Gère automatiquement le rafraîchissement des tokens d'authentification.
 ****/


import axios, { AxiosInstance } from 'axios';
import { ApiError } from './errors';
import { loadRuntimeConfig, getCachedRuntimeConfig } from '@/config/runtimeConfig';

let httpInstance: AxiosInstance | null = null;

export async function getHttp(): Promise<AxiosInstance> {
    if (httpInstance) return httpInstance;
    const cfg = await loadRuntimeConfig();
    const baseURL = cfg?.VITE_API_URL || '/api';
    httpInstance = axios.create({
        baseURL,
        withCredentials: true,
        headers: { Accept: 'application/json' },
    });

    let refreshing = false;
    let waiters: Array<() => void> = [];

    // Request interceptor: inject Bearer token for JWT RS256 mode
    // httpInstance.interceptors.request.use((config) => {
    //     const token = localStorage.getItem('accessToken');
    //     if (token && !config.headers.Authorization) {
    //         config.headers.Authorization = `Bearer ${token}`;
    //     }
    //     return config;
    // });

    httpInstance.interceptors.response.use(
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
                    await httpInstance!.get('/authentication/refreshToken');
                    refreshing = false;
                    waiters.forEach(w => w()); waiters = [];
                }
                return httpInstance!.request({ ...config, __isRetry: true });
            } catch (e: any) {
                refreshing = false; waiters = [];
                throw new ApiError('Session expirée', 401, e?.response?.data ?? e?.message);
            }
        }
    );
    return httpInstance;
}
