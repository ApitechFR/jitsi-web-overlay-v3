import { useState } from 'react';

/**
 * Hook pour gérer les filtres de dates (start/end) utilisés dans le dashboard.
 * Fournit les valeurs, setters et un handler commun pour les inputs date.
 */
export function useDashboardDateFilters(initialStart = '', initialEnd = '') {
    const [startDate, setStartDate] = useState<string>(initialStart);
    const [endDate, setEndDate] = useState<string>(initialEnd);

    /**
     * Handler générique pour les inputs date.
     * @param e Event input
     * @param type 'start' ou 'end'
     */
    const handleDashboardDateChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'start' | 'end'
    ) => {
        const dateString = e.target.value;
        const date = new Date(dateString);
        if (type === 'end') date.setHours(23, 59, 59, 999);
        const newDateString = date.toISOString();
        if (type === 'start') setStartDate(newDateString);
        else setEndDate(newDateString);
    };

    return {
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        handleDashboardDateChange,
    };
}
