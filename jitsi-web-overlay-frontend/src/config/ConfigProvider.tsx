import { createContext, useContext, useEffect, useState } from 'react';
import { FrontConfig, loadRuntimeConfig } from './runtimeConfig';
import CircularProgress from '@mui/material/CircularProgress';

const ConfigCtx = createContext<FrontConfig | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [cfg, setCfg] = useState<FrontConfig | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        loadRuntimeConfig()
            .then(setCfg)
            .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
    }, []);

    if (err)
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="p-4 text-red-600">Erreur de config: le Serveur est non joignable {err}</div>
            </div>
        );
    if (!cfg)
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress style={{ height: '150px', width: '150px' }} />
            </div>
        );
    // Return the provider with the loaded config
    return <ConfigCtx.Provider value={cfg}>{children}</ConfigCtx.Provider>;
}

export function useRuntimeConfig() {
    const ctx = useContext(ConfigCtx);
    if (!ctx) throw new Error('useRuntimeConfig must be used inside <ConfigProvider>');
    return ctx;
}