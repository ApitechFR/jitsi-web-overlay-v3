import axios from 'axios';
import { getCachedRuntimeConfig } from '../config/runtimeConfig';


function getBaseUrl() {
    const cfg = getCachedRuntimeConfig();
    return cfg?.VITE_API_URL || '';
}

const api = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true,
});

// Interceptor: Injecte Authorization header si JWT Bearer token stocké
api.interceptors.request.use(
    (config) => {
        // Récupére le JWT Bearer token du localStorage
        const token = localStorage.getItem('accessToken');

        // Si on a un token ET qu'on n'a pas déjà un Authorization header
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;