import { http } from '../../http';
import { toApiError } from '../../errors';
import { UserInfos } from './auth.types';
import { decodeJwt } from '@/utils/decodeJwt';
import { joinUrl } from '@/utils/url';

const baseApi = (import.meta.env.VITE_API_URL as string | undefined) || '/api';


async function userinfo(): Promise<UserInfos | null> {
    try {
        const { data } = await http.get<UserInfos>('/authentication/userinfo');
        return data ?? null;
    } catch (e) {
        const err = toApiError(e);
        if (err.status === 401) return null;
        return null;
    }
}

async function userinfoDecoded(): Promise<UserInfos | null> {
    const data = await userinfo();
    if (!data) return null;
    if (data.idToken && typeof data.idToken === 'string') {
        try { return decodeJwt(data.idToken) as unknown as UserInfos; }
        catch { /* ignore */ }
    }
    return data;
}

function getLoginUrl(confName?: string) {
    const url = joinUrl(baseApi, '/authentication/login_authorize');
    const params = new URLSearchParams({ ...(confName ? { room: confName } : {}), state: genState() });

    sessionStorage.setItem('oidc_state', params.get('state') || '');
    return `${url}?${params.toString()}`;

}

function getLogoutUrl() {
    return joinUrl(baseApi, '/authentication/logout');
}

function genState() {
    return [...crypto.getRandomValues(new Uint8Array(16))]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export const AuthService = {
    userinfo,
    userinfoDecoded,
    getLoginUrl,
    getLogoutUrl,
};



