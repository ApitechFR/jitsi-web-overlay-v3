import styles from './Dashboard.module.css';
import { Breadcrumb } from '@apitechfr/react-dsapitech/Breadcrumb';
import { RadioButtons } from '@apitechfr/react-dsapitech/RadioButtons';
import { ToggleSwitch } from '@apitechfr/react-dsapitech/ToggleSwitch';
import { Input } from '@apitechfr/react-dsapitech/Input';
import { Card } from '@apitechfr/react-dsapitech/Card';
import { useEffect, useState } from 'react';

import cardsData from '../../../data/cardConfig.json';
import Button from '@apitechfr/react-dsapitech/Button';

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

  useEffect(() => {
    const dataFromDB: Record<string, number> = {
      users: 1523,
      confNb: 348,
      confTime: 89,
      confMoyPart: 74,
      confMaxSimult: 12,
      partMaxSimult: 245,
    };

    const mergedData = cardsData.map(meta => ({
      ...meta,
      valeur: dataFromDB[meta.key] ?? 0,
    }));

    setDatasCard(mergedData);
  }, []);

  return (
    <div className={styles.content}>
      <Breadcrumb
        currentPageLabel="Dashboard"
        homeLinkProps={{
          href: '/',
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
                label: "Aujourd'hui",
                nativeInputProps: {
                  value: 'value1',
                },
              },
              {
                label: 'Cette semaine',
                nativeInputProps: {
                  value: 'value2',
                },
              },
              {
                label: 'Ce mois-ci',
                nativeInputProps: {
                  value: 'value3',
                },
              },
              {
                label: 'Cette année',
                nativeInputProps: {
                  value: 'value4',
                },
              },
            ]}
            orientation="horizontal"
            state="default"
          />
          {datasCard && (
            <div className={styles.cardsSection}>
              {datasCard.map(card => (
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
                    type: 'date',
                  }}
                />
                <Input
                  label="Date de fin"
                  nativeInputProps={{
                    type: 'date',
                  }}
                />
              </div>
              <div className={styles.validButton}>
                <Button
                  onClick={() => {
                    console.log('Période validée');
                  }}
                >
                  <span>Valider</span>
                </Button>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

export default Dashboard;