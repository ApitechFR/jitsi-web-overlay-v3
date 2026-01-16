import { useState, useCallback, useEffect } from 'react';

/**
 * Generic hook for making API calls with loading and error management.
 * @param fetcher Asynchronous function that returns the data to fetch
 * @param immediate If true, triggers the fetch on mount
 */
export function useApiFetch<T = any>(
    fetcher: () => Promise<T>,
    immediate = true
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetcher();
            setData(result);
            return result;
        } catch (err: any) {
            setError(err);
            setData(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [fetcher]);


    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [execute, immediate]);

    return { data, loading, error, refetch: execute };
}
