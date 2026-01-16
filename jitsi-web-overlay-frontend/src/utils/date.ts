import i18n from 'i18next';

export const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const lang = i18n.language || navigator.language || 'fr-FR';
    return new Intl.DateTimeFormat(lang, {
        timeZone:  'UTC',
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(isoString));
};
