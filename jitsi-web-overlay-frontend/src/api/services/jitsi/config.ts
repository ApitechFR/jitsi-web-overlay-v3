import { getCachedRuntimeConfig } from '@/config/runtimeConfig';

export function getReplayCheckTimeoutMs(): number {
    const cfg = getCachedRuntimeConfig();
    const parsed = Number(cfg?.VITE_REPLAY_CHECK_TIMEOUT_MS);
    return Number.isFinite(parsed) ? parsed : 600000;
}