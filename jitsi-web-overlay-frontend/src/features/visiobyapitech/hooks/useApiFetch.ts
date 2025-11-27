import React from 'react';
import { useState, useCallback } from 'react';

/**
 * Generic hook for making API calls with loading and error management.
 * @param fetcher Asynchronous function that returns the data (e.g., () => fetch(...))
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


    React.useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [execute, immediate]);

    return { data, loading, error, refetch: execute };
}
