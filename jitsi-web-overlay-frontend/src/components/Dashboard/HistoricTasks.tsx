import { RadioButtons, ToggleSwitch, Input, Card, Button } from '@ds'

import { useEffect, useState } from 'react';
import { useDashboardDateFilters } from '../../hooks/useDashboardDateFilters';

import type { CardData, PeriodFilter } from '@/api/services/dashboard/dashboard.types';
import cardsData from '@/data/cardConfig.json';


import { DashboardService } from '@/api/services/dashboard/dashboard.service';
import { mapHistoricStatsToCards } from '@/api/services/dashboard/dashboard.utils';

import './DashboardComponent.css'
import { useTranslation } from 'react-i18next';

function HistoricTasks() {
    const { t } = useTranslation();

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

        if (startDate || endDate) {
            setStartDate("");
            setEndDate("");
        }
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
        if(!isToogleActive) {
            const fetchData = async () => {
                try {
                    const dataHistoricConf = await DashboardService.fetchHistoricStats(value);
                    setLocalData(prev => mapHistoricStatsToCards(prev, dataHistoricConf));
                } catch (error) {
                    console.error("Erreur lors du fetch des données :", error);
                }
            };
            if (value) fetchData();
        }
    }, [value, isToogleActive]);


    return (
        <>
            <h2 className="dashboardComponentTitle">{t('dashboard.historicStatsTitle')}</h2>
            <div className="dashboardStructure">
                <div className="dashboardSide">
                    <article className="dashboardContent">
                        <RadioButtons
                            disabled={isToogleActive}
                            legend={t('dashboard.filtersLegend')}
                            name="radio"
                            options={[
                                {
                                    label: t('dashboard.today'),
                                    nativeInputProps: {
                                        checked: value === "today",
                                        onChange: () => setValue("today"),
                                    }
                                },
                                {
                                    label: t('dashboard.thisWeek'),
                                    nativeInputProps: {
                                        checked: value === "week",
                                        onChange: () => setValue("week"),
                                    }
                                },
                                {
                                    label: t('dashboard.thisMonth'),
                                    nativeInputProps: {
                                        checked: value === "month",
                                        onChange: () => setValue("month"),
                                    }
                                },
                                {
                                    label: t('dashboard.thisYear'),
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
                                        desc={t(card.description)}
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
                        label={t('dashboard.useGivenPeriod')}
                        labelPosition="left"
                        checked={isToogleActive}
                        onChange={handleToogleChange}
                    />
                    {isToogleActive && (
                        <div className="hiddenBlock">
                            <div className="separator" />
                            <div className="hiddenPeriodBlock">
                                <Input
                                    label={t('dashboard.startDate')}
                                    nativeInputProps={{
                                        type: 'date',
                                        value: startDate ? new Date(startDate).toISOString().split("T")[0] : "",
                                        onChange: (e) => handleDashboardDateChange(e, "start")
                                    }}
                                />
                                <Input
                                    label={t('dashboard.endDate')}
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
                                    <span>{t('dashboard.validate')}</span>
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