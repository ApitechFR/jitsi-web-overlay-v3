const parsed = Number(import.meta.env.VITE_REPLAY_CHECK_TIMEOUT_MS);
export const REPLAY_CHECK_TIMEOUT_MS = Number.isFinite(parsed) ? parsed : 600000;