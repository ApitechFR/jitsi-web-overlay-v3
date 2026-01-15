
import { Card } from '@ds';
import './DashboardComponent.css'
import React, { useState, useMemo } from 'react';
import { useApiFetch } from '@/hooks/useApiFetch';
import type { CardData } from '@/api/services/dashboard/dashboard.types';
import cardsData from '@/data/cardConfigRealtime.json';
import { DashboardService } from '@/api/services/dashboard/dashboard.service';
import { mapRealtimeStatsToCards } from '@/api/services/dashboard/dashboard.utils';


function RealTime() {

    const [isToogleActive, setIsToogleActive] = useState(false);
    const [localData, setLocalData] = useState<CardData[]>(cardsData);


    const { data: dataRealTime, loading, error } = useApiFetch(DashboardService.fetchRealtimeStats, true);

    const handleToggleChange = () => {
        setIsToogleActive(!isToogleActive);
    };

    // Met à jour les cartes dès que dataRealTime change
    React.useEffect(() => {
        if (!dataRealTime) return;
        setLocalData(prev => mapRealtimeStatsToCards(prev, dataRealTime));
    }, [dataRealTime]);

    return (
        <>
            <h2 className="dashboardComponentTitle">Statistiques temps réel</h2>
            <div className='dashboardComponentContent'>
                {loading && <p>Chargement...</p>}
                {error && <p style={{ color: 'red' }}>Erreur lors du chargement des données.</p>}
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