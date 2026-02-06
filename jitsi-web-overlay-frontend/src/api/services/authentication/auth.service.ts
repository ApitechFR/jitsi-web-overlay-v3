import { getHttp } from '../../http';
import { toApiError } from '../../errors';
import { UserInfos } from './auth.types';
import { decodeJwt } from '@/utils/decodeJwt';
import { joinUrl } from '@/utils/url';
import { genState, saveState } from './oidc.utils';

import { getCachedRuntimeConfig } from '@/config/runtimeConfig';

function getApiBaseUrl(): string {
    const cfg = getCachedRuntimeConfig();
    // Si la config n'est pas encore chargée, on retourne une chaîne vide
    return cfg?.VITE_API_URL || '/api';
}

// Toutes les fonctions qui utilisent baseApi doivent attendre que la config soit chargée
function getBaseApiOrThrow(): string {
    const api = getApiBaseUrl();
    return api;
}
async function userinfo(): Promise<UserInfos | null> {
    const withTimeout = <T,>(p: Promise<T>, ms = 5000): Promise<T> =>
        new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(Object.assign(new Error('auth timeout'), { status: 0 })), ms);
            p.then(v => { clearTimeout(t); resolve(v); })
                .catch(e => { clearTimeout(t); reject(e); });
        });

    try {
        const http = await getHttp();
        const { data } = await withTimeout(http.get<UserInfos>('/authentication/userinfo'), 5000);
        return data ?? null;
    } catch (e) {
        const err = toApiError(e);
        //  On mappe 401 en invité, on ne bloque jamais l’UI
        if (err.status === 401) return null;
        //  Réseau/timeout/5xx → on traite comme invité pour ne pas spinner
        return null;
    }
}

async function userinfoDecoded(): Promise<UserInfos | null> {
    const data = await userinfo();
    if (!data) return null;
    if (data.idToken && typeof data.idToken === 'string') {
        try { return decodeJwt(data.idToken) as unknown as UserInfos; } catch { }
    }
    return data;
}







function getLoginUrl(confName?: string, sessionOnly?: boolean) {
    const url = joinUrl(getBaseApiOrThrow(), '/authentication/login_authorize');
    const state = genState();
    saveState(state);

    const params: Record<string, string> = { state };
    if (confName) params.room = confName;

    if (sessionOnly) params.sessionOnly = '1';

    const qs = new URLSearchParams(params);
    return `${url}?${qs.toString()}`;
}




function getLoginCallbackUrl(code: string, state: string) {
    const url = joinUrl(getBaseApiOrThrow(), '/authentication/login_callback');
    const qs = new URLSearchParams({ code, state });
    return `${url}?${qs.toString()}`;
}


async function logout() {
    try {
        const http = await getHttp();
        return await http.post('/authentication/logout');
    } catch (e) {
        throw toApiError(e);
    }
}

function getLogoutUrl() {
    return joinUrl(getBaseApiOrThrow(), '/authentication/logout');
}


export const AuthService = {
    userinfo,
    userinfoDecoded,
    getLoginUrl,
    getLogoutUrl,
    getLoginCallbackUrl,
    logout,
};



