export function genState() {
    return [...crypto.getRandomValues(new Uint8Array(16))]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export function saveState(state: string) {
    sessionStorage.setItem('oidc_state', state);
}

export function readState(): string | null {
    return sessionStorage.getItem('oidc_state');
}

export function clearState() {
    sessionStorage.removeItem('oidc_state');
}
