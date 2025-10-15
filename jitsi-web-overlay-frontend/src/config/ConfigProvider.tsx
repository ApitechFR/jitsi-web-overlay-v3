import { createContext, useContext, useEffect, useState } from 'react';
import { FrontConfig, loadRuntimeConfig } from './runtimeConfig';

const ConfigCtx = createContext<FrontConfig | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [cfg, setCfg] = useState<FrontConfig | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        loadRuntimeConfig()
            .then(setCfg)
            .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
    }, []);

    if (err) return <div className="p-4 text-red-600">Erreur de config: {err}</div>;
    if (!cfg) return <div className="p-4">Chargement de la configuration…</div>;

    return <ConfigCtx.Provider value={cfg}>{children}</ConfigCtx.Provider>;
}

export function useRuntimeConfig() {
    const ctx = useContext(ConfigCtx);
    if (!ctx) throw new Error('useRuntimeConfig must be used inside <ConfigProvider>');
    return ctx;
}