export function joinUrl(base: string | undefined, path: string) {
    const b = base ? (base.endsWith('/') ? base.slice(0, -1) : base) : '';
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${b}${p}`;
}
