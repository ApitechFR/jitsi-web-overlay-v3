export type FrontConfig = {
    VITE_API_URL?: string;
    VITE_APP_TEMPLATE?: string;
    VITE_JITSI_DOMAIN?: string;
    VITE_VOXAPI_URL?: string;
    VITE_CONFERENCE_NAME_REGEX?: string;
    VITE_CONFERENCE_NAME_REGEX_MESSAGE?: string;
    VITE_ENABLE_JIBRI_APITECH_API?: boolean | string;
    VITE_JIBRI_APITECH_API_DOMAIN?: string;
    VITE_REPLAY_CHECK_TIMEOUT_MS?: number | string;
    VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS?: number | string;
    VITE_FRONTCONF_ROOMNAMECONSTRAINT_LENGTH?: number | string;
    VITE_APP_ORGANIZATION?: string;
};

let cached: FrontConfig | null = null;
let inflight: Promise<FrontConfig> | null = null;

export async function loadRuntimeConfig(force = false): Promise<FrontConfig> {
    if (cached && !force) return cached;
    if (inflight && !force) return inflight;

    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) || '/api';
    const url = `${apiBase.replace(/\/$/, '')}/config`;

    inflight = fetch(url, { credentials: 'include' })
        .then(async (r) => {
            if (!r.ok) throw new Error(`Failed to load config: ${r.status}`);
            const raw = (await r.json()) as FrontConfig;

            // coercions utiles (string -> boolean/number) si backend renvoie en string
            const coerceBool = (v: any) => (typeof v === 'boolean' ? v : `${v}`.toLowerCase() === 'true');
            const coerceNum = (v: any) => (v === undefined ? undefined : Number(v));

            cached = {
                ...raw,
                VITE_APP_TEMPLATE: raw.VITE_APP_TEMPLATE || (import.meta.env.VITE_APP_TEMPLATE as string | undefined) || 'joona',
                VITE_ENABLE_JIBRI_APITECH_API: coerceBool(raw.VITE_ENABLE_JIBRI_APITECH_API),
                VITE_REPLAY_CHECK_TIMEOUT_MS: coerceNum(raw.VITE_REPLAY_CHECK_TIMEOUT_MS),
                VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS: coerceNum(raw.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS),
                VITE_FRONTCONF_ROOMNAMECONSTRAINT_LENGTH: coerceNum(raw.VITE_FRONTCONF_ROOMNAMECONSTRAINT_LENGTH),
            };
            return cached;
        })
        .finally(() => (inflight = null));

    return inflight;
}

export function getCachedRuntimeConfig(): FrontConfig | null {
    return cached;
}