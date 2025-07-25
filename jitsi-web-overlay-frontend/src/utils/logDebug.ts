// Utilitaire pour loguer en mode debug uniquement si VITE_DEBUG=true
export function logDebug(...args: unknown[]) {
  if (import.meta.env.VITE_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.log('[DEBUG]', ...args);
  }
}
