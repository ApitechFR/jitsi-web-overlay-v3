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
export async function userinfo(): Promise<UserInfos | null> {
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
    // In JWT RS256 mode (reseller), extract userinfo from the JWT token itself
    if (isJwtMode()) {
        const token = getBearer();
        if (token) {
            const payload = decodeJwtPayload(token);
            const userinfos = await userinfo() as UserInfos | null;
            if (payload) {
                return {
                    uid: payload.uid || userinfos?.uid,
                    email: payload.email,
                    name: payload.name || payload.preferred_username,
                    given_name: payload.given_name,
                    family_name: payload.family_name,
                    idToken: token, // Include the JWT as idToken for consistency
                    clientId: payload.clientId,
                } as UserInfos;
            }
        }
        return null;
    }

    // In OIDC mode (single-tenant), get userinfo from endpoint
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
        return await http.get('/authentication/logout');
    } catch (e) {
        throw toApiError(e);
    }
}

function getLogoutUrl() {
    return joinUrl(getBaseApiOrThrow(), '/authentication/logout');
}

// ===== JWT RS256 (Multi-Tenant) Functions =====

function setBearer(token: string) {
    localStorage.setItem('accessToken', token);
}

function getBearer(): string | null {
    return localStorage.getItem('accessToken');
}

function clearBearer() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}

function isJwtMode(): boolean {
    // Check if system is configured for multi-tenant (JWT RS256) mode
    // In that case, check if we have a valid Bearer token
    const cfg = getCachedRuntimeConfig();
    const resellerModeEnabled = cfg?.VITE_RESELLER_MODE_ENABLED === true || cfg?.VITE_RESELLER_MODE_ENABLED === 'true';
    if (!resellerModeEnabled) {
        // Single-tenant mode (OIDC): never JWT mode
        return false;
    }
    // Multi-tenant mode: check if we have a Bearer token
    return !!getBearer();
}

function decodeJwtPayload(token: string): Record<string, any> | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const decoded = JSON.parse(atob(parts[1]));
        return decoded;
    } catch {
        return null;
    }
}

function getClientIdFromJwt(): string | null {
    const token = getBearer();
    if (!token) return null;
    const decoded = decodeJwtPayload(token);
    return decoded?.clientId || null;
}

function getOfferTypeFromJwt(): 'basic' | 'premium' | null {
    const token = getBearer();
    if (!token) return null;
    const decoded = decodeJwtPayload(token);
    const offerType = decoded?.offerType;
    return (offerType === 'basic' || offerType === 'premium') ? offerType : null;
}

async function logoutJwt() {
    try {
        const http = await getHttp();
        await http.get('/authentication/logout');
    } catch (e) {
        // Logout échoue, on nettoie le token local quand même
        console.warn('JWT logout failed:', e);
    } finally {
        clearBearer();
    }
}


export const AuthService = {
    userinfo,
    userinfoDecoded,
    getLoginUrl,
    getLogoutUrl,
    getLoginCallbackUrl,
    logout,
    // JWT RS256
    setBearer,
    getBearer,
    clearBearer,
    isJwtMode,
    decodeJwtPayload,
    getClientIdFromJwt,
    getOfferTypeFromJwt,
    logoutJwt,
};



