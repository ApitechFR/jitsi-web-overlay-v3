import i18n from 'i18next';

export const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const lang = i18n.language || navigator.language || 'fr-FR';
    return new Intl.DateTimeFormat(lang, {
        timeZone: 'UTC',
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(isoString));
};

export const formatReplayDate = (createdAt: string, updatedAt: string) => {
    const startDate = new Date(createdAt);
    const endDate = new Date(updatedAt);
    const lang = i18n.language || navigator.language || 'fr-FR';

    const sameDay = startDate.toDateString() === endDate.toDateString();

    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const dateFormatter = new Intl.DateTimeFormat(lang, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: userTimeZone,
    });

    const timeFormatter = new Intl.DateTimeFormat(lang, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone:  userTimeZone,
    });

    if (sameDay) {
        return i18n.t('replayListGrouped.date.sameDay', {
            date: dateFormatter.format(startDate),
            start: timeFormatter.format(startDate),
            end: timeFormatter.format(endDate),
        });
    }

    return i18n.t('replayListGrouped.date.multiDay', {
        startDate: dateFormatter.format(startDate),
        startTime: timeFormatter.format(startDate),
        endDate: dateFormatter.format(endDate),
        endTime: timeFormatter.format(endDate),
    });
};

