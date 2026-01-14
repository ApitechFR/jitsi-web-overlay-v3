export const formatDate = (isoString: string): string => {
    return new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'UTC',
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(isoString));
};
