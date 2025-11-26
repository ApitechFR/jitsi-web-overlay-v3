import { RadioButtons } from '@apitechfr/react-dsapitech/RadioButtons';
import { ToggleSwitch } from '@apitechfr/react-dsapitech/ToggleSwitch';
import { Input } from '@apitechfr/react-dsapitech/Input';
import { Card } from '@apitechfr/react-dsapitech/Card';
import { Table } from "@apitechfr/react-dsapitech/Table";
import { Pagination } from "@apitechfr/react-dsapitech/Pagination";
import Button from '@apitechfr/react-dsapitech/Button';
import { useEffect, useState } from 'react';
import { useDashboardDateFilters } from '../../hooks/useDashboardDateFilters';
import { DashboardService } from '@/api/services/dashboard/dashboard.service';
import { useRuntimeConfig } from '../../../../config/ConfigProvider';
import './DashboardComponent.css'

import type { CardDataFeedback, PeriodFilter, QuestionTextTableProps, DateFilters } from '@/api/services/dashboard/dashboard.types';
import { mapSurveyStatsToCards } from '@/api/services/dashboard/mapSurveyStatsToCards';

function QuestionTextTable({
    question,
    organization,
    filter,
    limitPerPage,
    dateFilters
}: QuestionTextTableProps) {
    const [page, setPage] = useState(1);
    const [responses, setResponses] = useState<string[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                let data;
                if (dateFilters.startDate && dateFilters.endDate) {
                    data = await DashboardService.fetchSurveyTextComments(
                        organization,
                        question,
                        page,
                        limitPerPage,
                        undefined,
                        dateFilters.startDate,
                        dateFilters.endDate
                    );
                } else {
                    data = await DashboardService.fetchSurveyTextComments(
                        organization,
                        question,
                        page,
                        limitPerPage,
                        filter
                    );
                }
                setResponses(data.responses ?? []);
                setTotalPages(data.pagination?.totalPages ?? 1);
            } catch (err) {
                console.error(`Erreur lors de la récupération des commentaires pour "${question}" :`, err);
                setResponses([]);
                setTotalPages(1);
            }
        };
        fetchComments();
    }, [question, organization, filter, page, limitPerPage, dateFilters]);

    return (
        <div>
            <Table
                className='fr-table-specific'
                caption=""
                headers={[question]}
                data={responses.map((rep: string) => [rep])}
                fixed
            />
            <Pagination
                count={totalPages}
                defaultPage={page}
                getPageLinkProps={(pageNum) => ({
                    href: "#",
                    onClick: (event) => {
                        event.preventDefault();
                        setPage(pageNum);
                    },
                })}
            />
        </div>
    );
}

function SurveyResults() {
    const cfg = useRuntimeConfig();
    const AppTemplate = (cfg.VITE_APP_ORGANIZATION as string) || '';

    const [isToogleActive, setIsToogleActive] = useState(false);
    const [localData, setLocalData] = useState<CardDataFeedback>({
        total: 0,
        rating: {},
        radio: {},
        text: {}
    });
    const [value, setValue] = useState<PeriodFilter>("today");
    const {
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        handleDashboardDateChange,
    } = useDashboardDateFilters();
    const [dateFilters, setDateFilters] = useState<DateFilters>({ startDate: "", endDate: "" });

    const [limitPerPage] = useState(10);

    const handleToogleChange = () => {
        setIsToogleActive(!isToogleActive);

        if (startDate || endDate) {
            setStartDate("");
            setEndDate("");
            setDateFilters({ startDate: "", endDate: "" })
        }

    };

    // Date management moved to the useDashboardDateFilters hook

    const applyDashboardDateChanges = async () => {
        if (!startDate || !endDate) return;

        setDateFilters({ startDate, endDate });
    };

    // Fetch global stats (without pagination of text comments)
    useEffect(() => {
        const fetchStats = async () => {
            try {
                let dataFeedbackConf;
                if (dateFilters.startDate && dateFilters.endDate) {
                    dataFeedbackConf = await DashboardService.fetchSurveyStatsByDate(AppTemplate, startDate, endDate);
                } else {
                    dataFeedbackConf = await DashboardService.fetchSurveyStats(AppTemplate, value);
                }
                setLocalData(dataFeedbackConf);
            } catch (error) {
                console.error('Erreur lors de la récupération des résultats de sondage :', error);
            }
        };
        fetchStats();
    }, [value, AppTemplate, dateFilters, startDate, endDate]);

    return (
        <>
            <h2 className="dashboardComponentTitle">Résultats sondage</h2>
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
                            <div className="survey_cards">
                                {mapSurveyStatsToCards(localData).length > 0 ? (
                                    mapSurveyStatsToCards(localData).map(card => (
                                        <div className="card_template" key={card.key}>
                                            <Card
                                                background
                                                border
                                                desc={card.description}
                                                size="medium"
                                                title={card.valeur}
                                                titleAs="h2"
                                                className="cardStyle"
                                                detail={card.label}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p>Il n'y a pas de données enregistrée pour cette période</p>
                                )}
                            </div>
                        )}

                        <div className='table_commentary'>
                            <h3>Commentaires utilisateurs</h3>
                            <div className='table_commentary_content'>
                                {Object.keys(localData.text ?? {}).length > 0 ? (
                                    Object.keys(localData.text ?? {}).map((question) => (
                                        <QuestionTextTable
                                            key={question}
                                            question={question}
                                            organization={AppTemplate}
                                            filter={value}
                                            limitPerPage={limitPerPage}
                                            dateFilters={dateFilters}
                                        />
                                    ))
                                ) : (
                                    <p>Il n'y a pas de données enregistrée pour cette période</p>
                                )}
                            </div>
                        </div>

                        <h3>Réponses des questions à choix multiples</h3>
                        <div className='table_commentary_content'>
                            {Object.keys(localData.radio ?? {}).length > 0 ? (
                                Object.entries(localData.radio ?? {}).map(([answer, data]) => (
                                    <Table
                                        caption=""
                                        data={Object.entries(data.choicesStats ?? {}).map(([choice, count]) => [
                                            choice,
                                            String(count)
                                        ])}
                                        headers={[answer, "Nombre"]}
                                        noCaption
                                        fixed
                                        key={answer}
                                    />
                                ))
                            ) : (
                                <p>Il n'y a pas de données enregistrée pour cette période</p>
                            )}
                        </div>

                        <div className='exportButton'>
                            <Button
                                onClick={() => {
                                    const url = DashboardService.getExportUrl({
                                        baseUrl: cfg.VITE_API_URL || '',
                                        value,
                                        dateFilters
                                    });
                                    window.location.href = url;
                                }}
                            >
                                Exporter les résultats
                            </Button>
                        </div>
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
                                <Button onClick={applyDashboardDateChanges}>
                                    <span>Valider</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </>
    );
};

export default SurveyResults;