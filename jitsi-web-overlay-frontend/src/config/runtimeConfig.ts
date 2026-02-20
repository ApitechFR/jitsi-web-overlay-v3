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
    VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINLENGTH?: number | string;
    VITE_FRONTCONF_ROOMNAMECONSTRAINT_MAXLENGTH?: number | string;
    VITE_APP_ORGANIZATION?: string;
    VITE_FRONTCONF_ROOMNAMECONSTRAINT_GENMAXLENGTH?: number | string;
    VITE_FRONTCONF_ROOMNAMECONSTRAINT_GENMINLENGTH?: number | string;
    VITE_APP_LIGHTVISIOLOGOHEADER?: string;
    VITE_APP_DARKVISIOLOGOHEADER?: string;
    VITE_APP_LIGHTVISIOLOGOFOOTER?: string;
    VITE_APP_DARKVISIOLOGOFOOTER?: string;
    VITE_APP_FOOTERDESCRIPTION?: string;
    VITE_APP_HEADERSERVICETITLE?: string;
    VITE_APP_HEADERSERVICETAGLINE?: string;
    VITE_APP_FOOTERLINKS?: string;
    VITE_APP_CHANGELOG_URL?: string;
    VITE_APP_FAQ_URL?: string;
    VITE_APP_FAQ_URL_FR?: string;
    VITE_APP_FAQ_URL_EN?: string;
    VITE_APP_TITLE?: string;
    VITE_APP_FAVICON_URL?: string;
    VITE_IS_WEBINAR_ENABLED?: boolean | string;
    VITE_ENABLE_LANGUAGE_SWITCH?: boolean | string;
    VITE_ENABLE_HARDWARE_TEST?: boolean | string;
    VITE_RESELLER_MODE_ENABLED?: boolean | string;
    VITE_RESELLER_AUTH_URL?: string;
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
                VITE_APP_CHANGELOG_URL: raw.VITE_APP_CHANGELOG_URL || (import.meta.env.VITE_APP_CHANGELOG_URL as string | undefined) || '/infos.json',
                VITE_APP_FAQ_URL: raw.VITE_APP_FAQ_URL || (import.meta.env.VITE_APP_FAQ_URL as string | undefined) || '/doc/Documentation_utilisateur_Visio_By_Apitech.pdf',
                VITE_APP_FAQ_URL_FR: raw.VITE_APP_FAQ_URL_FR || (import.meta.env.VITE_APP_FAQ_URL_FR as string | undefined) || '/doc/Documentation_utilisateur_Visio_By_Apitech_FR.pdf',
                VITE_APP_FAQ_URL_EN: raw.VITE_APP_FAQ_URL_EN || (import.meta.env.VITE_APP_FAQ_URL_EN as string | undefined) || '/doc/Documentation_utilisateur_Visio_By_Apitech_EN.pdf',
                VITE_APP_TITLE: raw.VITE_APP_TITLE || (import.meta.env.VITE_APP_TITLE as string | undefined) || 'Visio By Apitech',
                VITE_API_URL: (import.meta.env.VITE_API_URL as string | undefined) || '/api',
                VITE_APP_TEMPLATE: raw.VITE_APP_TEMPLATE || (import.meta.env.VITE_APP_TEMPLATE as string | undefined) || 'joona',
                VITE_APP_LIGHTVISIOLOGOHEADER: raw.VITE_APP_LIGHTVISIOLOGOHEADER || (import.meta.env.VITE_APP_LIGHTVISIOLOGOHEADER as string | undefined) || '/assets/visiobyapitech-creme.png',
                VITE_APP_DARKVISIOLOGOHEADER: raw.VITE_APP_DARKVISIOLOGOHEADER || (import.meta.env.VITE_APP_DARKVISIOLOGOHEADER as string | undefined) || '/assets/visiobyapitech-creme.png',
                VITE_APP_LIGHTVISIOLOGOFOOTER: raw.VITE_APP_LIGHTVISIOLOGOFOOTER || (import.meta.env.VITE_APP_LIGHTVISIOLOGOFOOTER as string | undefined) || '/assets/apitech-logo-bleunuit.png',
                VITE_APP_DARKVISIOLOGOFOOTER: raw.VITE_APP_DARKVISIOLOGOFOOTER || (import.meta.env.VITE_APP_DARKVISIOLOGOFOOTER as string | undefined) || '/assets/apitech-logo-blanc.png',
                VITE_APP_FOOTERDESCRIPTION: raw.VITE_APP_FOOTERDESCRIPTION || (import.meta.env.VITE_APP_FOOTERDESCRIPTION as string | undefined) || '',
                VITE_APP_HEADERSERVICETITLE: raw.VITE_APP_HEADERSERVICETITLE || (import.meta.env.VITE_APP_HEADERSERVICETITLE as string | undefined) || '',
                VITE_APP_HEADERSERVICETAGLINE: raw.VITE_APP_HEADERSERVICETAGLINE || (import.meta.env.VITE_APP_HEADERSERVICETAGLINE as string | undefined) || '',
                VITE_APP_FOOTERLINKS: raw.VITE_APP_FOOTERLINKS || (import.meta.env.VITE_APP_FOOTERLINKS as string | undefined) || '',
                VITE_ENABLE_JIBRI_APITECH_API: coerceBool(raw.VITE_ENABLE_JIBRI_APITECH_API),
                VITE_REPLAY_CHECK_TIMEOUT_MS: coerceNum(raw.VITE_REPLAY_CHECK_TIMEOUT_MS),
                VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS: coerceNum(raw.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS),
                VITE_APP_ORGANIZATION: raw.VITE_APP_ORGANIZATION || (import.meta.env.VITE_APP_ORGANIZATION as string | undefined) || 'apitech',
                VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINLENGTH: coerceNum(raw.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINLENGTH),
                VITE_FRONTCONF_ROOMNAMECONSTRAINT_MAXLENGTH: coerceNum(raw.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MAXLENGTH),
                VITE_FRONTCONF_ROOMNAMECONSTRAINT_GENMINLENGTH: coerceNum(raw.VITE_FRONTCONF_ROOMNAMECONSTRAINT_GENMINLENGTH),
                VITE_FRONTCONF_ROOMNAMECONSTRAINT_GENMAXLENGTH: coerceNum(raw.VITE_FRONTCONF_ROOMNAMECONSTRAINT_GENMAXLENGTH),
                VITE_APP_FAVICON_URL: raw.VITE_APP_FAVICON_URL || (import.meta.env.VITE_APP_FAVICON_URL as string | undefined) || '/joona/Icone_produits_V.svg',
                VITE_ENABLE_LANGUAGE_SWITCH: coerceBool(raw.VITE_ENABLE_LANGUAGE_SWITCH ?? (import.meta.env.VITE_ENABLE_LANGUAGE_SWITCH as string | undefined) ?? 'false'),
                VITE_ENABLE_HARDWARE_TEST: coerceBool(raw.VITE_ENABLE_HARDWARE_TEST ?? (import.meta.env.VITE_ENABLE_HARDWARE_TEST as string | undefined) ?? 'false'),
                VITE_RESELLER_MODE_ENABLED: coerceBool(raw.VITE_RESELLER_MODE_ENABLED ?? (import.meta.env.VITE_RESELLER_MODE_ENABLED as string | undefined) ?? 'false'),
                VITE_RESELLER_AUTH_URL: raw.VITE_RESELLER_AUTH_URL || (import.meta.env.VITE_RESELLER_AUTH_URL as string | undefined),
            };
            return cached;
        })
        .finally(() => (inflight = null));

    return inflight;
}

export function getCachedRuntimeConfig(): FrontConfig | null {
    return cached;
}