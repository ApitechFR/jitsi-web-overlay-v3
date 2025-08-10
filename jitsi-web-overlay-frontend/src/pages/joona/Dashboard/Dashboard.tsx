import styles from './Dashboard.module.css';
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb';
import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons';
import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { Card } from '@codegouvfr/react-dsfr/Card';
import { useEffect, useState } from 'react';

import cardsData from '../../../data/cardConfig.json';
import Button from '@codegouvfr/react-dsfr/Button';

type CardData = {
  key: string;
  description: string;
  valeur: number;
  // add other properties from cardsData if needed
};

function Dashboard() {
  const [isToogleActive, setIsToogleActive] = useState(false);
  const [datasCard, setDatasCard] = useState<CardData[]>([]);

  const handleToogleChange = () => {
    setIsToogleActive(!isToogleActive);
  };

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/stats/realtime`);
                return await response.json();
            } catch (error) {
                console.error('Erreur lors de la récupération des données :', error);
            }
        };

        const setupData = async () => {
            const data = await fetchStats();
            const totalParticipants = data.participants || 0;
            const totalConferences = data.conferences || 1; // éviter division par zéro

            const MoyParticipantsPerConf = totalConferences > 0
                ? Math.round(totalParticipants / totalConferences)
                : 0;

            const dataFromDB: Record<string, number> = {
                users: data.participants,
                confNb: data.conferences,
                confTime: 89,
                confMoyPart: MoyParticipantsPerConf,
                confMaxSimult: 12,
                partMaxSimult: 245
            };

            const mergedData: any = cardsData.map((meta: any) => ({
                ...meta,
                valeur: dataFromDB[meta.key] ?? 0
            }));

            setDatasCard(mergedData);
        };

        setupData();
    }, []);

    return (
        <div className={styles.content}>
            <Breadcrumb
                currentPageLabel="Dashboard"
                homeLinkProps={{
                    to: '/'
                }}
                segments={[]}
            />
            <h1 className={styles.title}>Dashboard</h1>
            <section className={styles.sectionDashboard}>
                <article className={styles.dashboardContent}>
                    <RadioButtons
                        disabled={isToogleActive}
                        legend="Filtres"
                        name="radio"
                        options={[
                            {
                                label: 'Aujourd\'hui',
                                nativeInputProps: {
                                    value: 'value1'
                                }
                            },
                            {
                                label: 'Cette semaine',
                                nativeInputProps: {
                                    value: 'value2'
                                }
                            },
                            {
                                label: 'Ce mois-ci',
                                nativeInputProps: {
                                    value: 'value3'
                                }
                            },
                            {
                                label: 'Cette année',
                                nativeInputProps: {
                                    value: 'value4'
                                }
                            }
                        ]}
                        orientation="horizontal"
                        state="default"
                    />
                    {datasCard && (
                        <div className={styles.cardsSection}>
                            {datasCard.map((card: any) => (
                                <Card
                                    background
                                    border
                                    desc={card.description}
                                    size="medium"
                                    title={card.valeur}
                                    titleAs="h2"
                                    className={styles.cardStyle}
                                    key={card.key}
                                />
                            ))}
                        </div>
                    )}
                </article>
                <aside className={styles.periodBlock}>
                    <ToggleSwitch
                        inputTitle="the-title"
                        label="Utiliser une période donnée"
                        labelPosition="left"
                        checked={isToogleActive}
                        onChange={handleToogleChange}
                    />
                    {isToogleActive && (
                        <div className={styles.hiddenBlock}>
                            <div className={styles.separator} />
                            <div className={styles.hiddenPeriodBlock}>
                                <Input
                                    label="Date de début"
                                    nativeInputProps={{
                                        type: 'date'
                                    }}
                                />
                                <Input
                                    label="Date de fin"
                                    nativeInputProps={{
                                        type: 'date'
                                    }}
                                />
                            </div>
                            <div className={styles.validButton}>
                                <Button
                                    onClick={function noRefCheck() { }}
                                >
                                    <span>Valider</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </aside>
            </section>
        </div>
    )
}

export default Dashboard;