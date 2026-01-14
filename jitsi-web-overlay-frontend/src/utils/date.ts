export const formatDate = (isoString: string): string => {
    console.log('Formatting date:', isoString);
    console.log('returned value:', new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(isoString)));
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(isoString));
};
