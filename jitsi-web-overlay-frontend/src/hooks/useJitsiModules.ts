import { useEffect, useState } from 'react';
import { JitsiModulesService, type JitsiModuleOptions } from '@/api';

type UseJitsiModulesResult = {
    modules: JitsiModuleOptions | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};

export function useJitsiModules(): UseJitsiModulesResult {
    const [modules, setModules] = useState<JitsiModuleOptions | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await JitsiModulesService.fetch();
            setModules(data);
        } catch (e: any) {
            setError(e?.message || 'Erreur API jitsi-modules');
            setModules(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { modules, loading, error, refresh };
}
