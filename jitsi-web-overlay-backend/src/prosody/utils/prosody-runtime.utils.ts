import type { Occupant } from '../types/occupant.type';

/** Sépare une liste d'URLs par espaces ou virgules. */
export function splitList(v?: string): string[] {
    return (v ?? '')
        .split(/[,\s]+/)
        .map(s => s.trim())
        .filter(Boolean);
}

/** Concatène proprement prefix + endpoint (ex: '', '/muc_size' + '/room-size'). */
export function buildPath(apiPrefix: string, endpoint: string): string {
    const clean = (s: string) => s.replace(/^\/+|\/+$/g, '');
    const parts = [apiPrefix, endpoint].map(clean).filter(Boolean);
    return '/' + parts.join('/');
}

/** Joint un base URL et un chemin en évitant les doubles slashs. */
export function joinUrl(base: string, path: string): string {
    const b = base.replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
}

/** Construit une URL finale avec query params + token optionnel. */
export function makeUrl(
    base: string,
    path: string,
    query: Record<string, string>,
    opts?: { token?: string; tokenKey?: string }
): string {
    const u = new URL(joinUrl(base, path));
    const qs = new URLSearchParams(query);
    if (opts?.token) qs.set(opts.tokenKey ?? 'token', opts.token);
    u.search = qs.toString();
    return u.toString();
}

/** Convertit un payload (number | string | object) en nombre si possible. */
export function parseNumberLike(data: unknown): number | null {
    if (typeof data === 'number') return data;
    if (typeof data === 'string' && data.trim() !== '') {
        const n = Number(data);
        return Number.isNaN(n) ? null : n;
    }
    if (data && typeof data === 'object') {
        const o = data as Record<string, any>;
        const n = Number(o.count ?? o.size ?? o.sessions);
        return Number.isNaN(n) ? null : n;
    }
    return null;
}

/** Extrait le nombre de participants (hors focus) de réponses hétérogènes. */
export function parseParticipantsNumber(data: unknown): number {
    if (typeof data === 'number') return data;
    if (typeof data === 'string') {
        const n = Number(data);
        return Number.isNaN(n) ? 0 : n;
    }
    if (data && typeof data === 'object') {
        const o = data as Record<string, any>;
        const n = Number(o.participants ?? o.occupants ?? o.count ?? o.size ?? 0);
        return Number.isNaN(n) ? 0 : n;
    }
    return 0;
}

/** Normalise la liste des occupants. */
export function parseOccupantsList(data: unknown): Occupant[] {
    if (Array.isArray(data)) return data as Occupant[];
    if (data && typeof data === 'object') {
        const o = data as Record<string, any>;
        if (Array.isArray(o.participants)) return o.participants as Occupant[];
    }
    return [];
}
