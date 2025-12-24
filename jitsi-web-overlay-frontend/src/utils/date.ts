export const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris',
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(date);
};
