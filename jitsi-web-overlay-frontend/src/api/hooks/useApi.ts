import { useState, useCallback } from "react";
import { ApiError, toApiError } from "../errors";


export function useApi<T extends any[], TResult>(fn: (...args: T) => Promise<TResult>) {
    const [error, setError] = useState<ApiError | null>(null);
    const [loading, setLoading] = useState(false);

    const run = useCallback(async (...args: T) => {
        setLoading(true);
        setError(null);
        try {
            const result = await fn(...args);
            setLoading(false);
            return result;
        } catch (e) {
            const apiError = toApiError(e);
            setError(apiError);
            setLoading(false);
            throw apiError;
        }
    }, [fn]);

    return { run, loading, error };
}