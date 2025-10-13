export class ApiError extends Error {
    status?: number;
    details?: unknown;

    constructor(message: string, status?: number, details?: unknown) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

export const toApiError = (
    error: unknown,
    defaultMessage = 'Le serveur a rencontré une erreur'
) => {
    if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response === 'object'
    ) {
        const response = (error as any).response;
        return new ApiError(
            defaultMessage,
            response?.status,
            response?.data ?? (error as any).message
        );
    }
    return new ApiError(
        defaultMessage,
        undefined,
        (error as any)?.message
    );
};