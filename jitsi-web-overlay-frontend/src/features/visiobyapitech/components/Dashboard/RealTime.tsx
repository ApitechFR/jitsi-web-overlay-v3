import { Card } from '@apitechfr/react-dsapitech/Card';
import './DashboardComponent.css'
import React, { useState } from 'react';
import { useApiFetch } from '../../hooks/useApiFetch';
import type { CardData } from '@/api/services/dashboard/dashboard.types';
import cardsData from '../../../../data/cardConfigRealtime.json';
import { DashboardService } from '@/api/services/dashboard/dashboard.service';
import { mapRealtimeStatsToCards } from '@/api/services/dashboard/dashboard.utils';
import { useTranslation } from 'react-i18next';


function RealTime() {
    const { t } = useTranslation();

    const [isToogleActive, setIsToogleActive] = useState(false);
    const [localData, setLocalData] = useState<CardData[]>(cardsData);


    const { data: dataRealTime, loading, error } = useApiFetch(DashboardService.fetchRealtimeStats, true);


    // Update local data when dataRealTime changes
    React.useEffect(() => {
        if (!dataRealTime) return;
        setLocalData(prev => mapRealtimeStatsToCards(prev, dataRealTime));
    }, [dataRealTime]);

    return (
        <>
            <h2 className="dashboardComponentTitle">{t('dashboard.realtimeTitle', 'Statistiques temps réel')}</h2>
            <div className='dashboardComponentContent'>
                {loading && <p>{t('dashboard.loading', 'Chargement...')}</p>}
                {error && <p style={{ color: 'red' }}>{t('dashboard.errorLoading', 'Erreur lors du chargement des données.')}</p>}
                {localData && !loading && !error && (
                    <div className="cardsSection">
                        {localData.map((card: any) => (
                            <Card
                                background
                                border
                                desc={card.description}
                                size="medium"
                                title={card.valeur}
                                titleAs="h2"
                                className="cardStyle"
                                key={card.key}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
};

export default RealTime;