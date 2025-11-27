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
    let apiError: ApiError;
    if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response === 'object'
    ) {
        const response = (error as any).response;
        apiError = new ApiError(
            defaultMessage,
            response?.status,
            response?.data ?? (error as any).message
        );
    } else {
        apiError = new ApiError(
            defaultMessage,
            undefined,
            (error as any)?.message
        );
    }
    if (apiError.message === 'Le serveur a rencontré une erreur') {
        // Déconnexion immédiate de l'utilisateur
        window.location.href = '/login';
    }
    return apiError;
};