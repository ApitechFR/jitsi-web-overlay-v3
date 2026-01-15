import { RadioButtons, ToggleSwitch, Input, Card, Button } from '@ds'

import { useEffect, useState } from 'react';
import { useDashboardDateFilters } from '../../hooks/useDashboardDateFilters';

import type { CardData, PeriodFilter } from '@/api/services/dashboard/dashboard.types';
import cardsData from '@/data/cardConfig.json';


import { DashboardService } from '@/api/services/dashboard/dashboard.service';
import { mapHistoricStatsToCards } from '@/api/services/dashboard/dashboard.utils';

import './DashboardComponent.css'

function HistoricTasks() {

    const [isToogleActive, setIsToogleActive] = useState(false);
    const [localData, setLocalData] = useState<CardData[]>(cardsData);
    const [value, setValue] = useState<PeriodFilter>("today");
    const {
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        handleDashboardDateChange
    } = useDashboardDateFilters();

    // Mapping factorisé dans dashboard.utils.ts

    const handleToogleChange = () => {
        setIsToogleActive(!isToogleActive);
    };

    // Manage apply date changes

    const applyDashboardDateChanges = async () => {
        if (!startDate || !endDate) return;
        try {
            const data = await DashboardService.fetchHistoricStatsByDate(startDate, endDate);
            setLocalData(prev => mapHistoricStatsToCards(prev, data));
        } catch (error) {
            console.error("Erreur lors du fetch des données par période :", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const dataHistoricConf = await DashboardService.fetchHistoricStats(value);
                setLocalData(prev => mapHistoricStatsToCards(prev, dataHistoricConf));
            } catch (error) {
                console.error("Erreur lors du fetch des données :", error);
            }
        };
        if (value) fetchData();
    }, [value]);


    return (
        <>
            <h2 className="dashboardComponentTitle">Statistiques historiques</h2>
            <div className="dashboardStructure">
                <div className="dashboardSide">
                    <article className="dashboardContent">
                        <RadioButtons
                            disabled={isToogleActive}
                            legend="Filtres"
                            name="radio"
                            options={[
                                {
                                    label: 'Aujourd\'hui',
                                    nativeInputProps: {
                                        checked: value === "today",
                                        onChange: () => setValue("today"),
                                    }
                                },
                                {
                                    label: 'Cette semaine',
                                    nativeInputProps: {
                                        checked: value === "week",
                                        onChange: () => setValue("week"),
                                    }
                                },
                                {
                                    label: 'Ce mois-ci',
                                    nativeInputProps: {
                                        checked: value === "month",
                                        onChange: () => setValue("month"),
                                    }
                                },
                                {
                                    label: 'Cette année',
                                    nativeInputProps: {
                                        checked: value === "year",
                                        onChange: () => setValue("year"),
                                    }
                                }
                            ]}
                            orientation="horizontal"
                            state="default"
                        />
                        {localData && (
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
                    </article>
                </div>
                <aside className="periodBlock">
                    <ToggleSwitch
                        inputTitle="the-title"
                        label="Utiliser une période donnée"
                        labelPosition="left"
                        checked={isToogleActive}
                        onChange={handleToogleChange}
                    />
                    {isToogleActive && (
                        <div className="hiddenBlock">
                            <div className="separator" />
                            <div className="hiddenPeriodBlock">
                                <Input
                                    label="Date de début"
                                    nativeInputProps={{
                                        type: 'date',
                                        value: startDate ? new Date(startDate).toISOString().split("T")[0] : "",
                                        onChange: (e) => handleDashboardDateChange(e, "start")
                                    }}
                                />
                                <Input
                                    label="Date de fin"
                                    nativeInputProps={{
                                        type: 'date',
                                        value: endDate ? new Date(endDate).toISOString().split("T")[0] : "",
                                        onChange: (e) => handleDashboardDateChange(e, "end")
                                    }}
                                />
                            </div>
                            <div className="validButton">
                                <Button
                                    onClick={applyDashboardDateChanges}
                                >
                                    <span>Valider</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </>
    )
};

export default HistoricTasks;