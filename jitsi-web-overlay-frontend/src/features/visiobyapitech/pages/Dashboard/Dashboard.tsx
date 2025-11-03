import styles from './Dashboard.module.css';
import { Breadcrumb } from '@apitechfr/react-dsapitech/Breadcrumb';
import { RadioButtons } from '@apitechfr/react-dsapitech/RadioButtons';
import { ToggleSwitch } from '@apitechfr/react-dsapitech/ToggleSwitch';
import { Input } from '@apitechfr/react-dsapitech/Input';
import { Card } from '@apitechfr/react-dsapitech/Card';
import Button from '@apitechfr/react-dsapitech/Button';
import { useEffect, useMemo, useState } from 'react';

import cardsData from '../../../../data/cardConfig.json';
import { StatsService, useApi } from '@/api';

type CardData = {
  key: string;
  description: string;
  valeur: number;
};

function Dashboard() {
  const [isToogleActive, setIsToogleActive] = useState(false);
  const [datasCard, setDatasCard] = useState<CardData[]>([]);

  const { run: loadRealtime, loading, error } = useApi(StatsService.realtime);

  useEffect(() => {
    (async () => {
      try {
        const data = await loadRealtime();
        const totalParticipants = data?.participants ?? 0;
        const totalConferences = data?.conferences ?? 0;

        const confMoyPart = totalConferences > 0
          ? Math.round(totalParticipants / totalConferences)
          : 0;

        // adapte ces valeurs si ton backend fournit d'autres champs
        const dataFromDB: Record<string, number> = {
          users: totalParticipants,
          confNb: totalConferences,
          confTime: 89,
          confMoyPart,
          confMaxSimult: 12,
          partMaxSimult: 245,
        };

        const merged: CardData[] = (cardsData as any[]).map((meta) => ({
          ...meta,
          valeur: dataFromDB[meta.key] ?? 0,
        }));

        setDatasCard(merged);
      } catch {
        // l'erreur est déjà exposée via `error`
      }
    })();
  }, [loadRealtime]);

  const radioOptions = useMemo(() => ([
    { label: "Aujourd'hui", nativeInputProps: { value: 'today' } },
    { label: 'Cette semaine', nativeInputProps: { value: 'week' } },
    { label: 'Ce mois-ci', nativeInputProps: { value: 'month' } },
    { label: "Cette année", nativeInputProps: { value: 'year' } },
  ]), []);

  return (
    <div className={styles.content}>
      <Breadcrumb currentPageLabel="Dashboard" homeLinkProps={{ href: '/' }} segments={[]} />
      <h1 className={styles.title}>Dashboard</h1>

      <section className={styles.sectionDashboard}>
        <article className={styles.dashboardContent}>
          <RadioButtons
            disabled={isToogleActive}
            legend="Filtres"
            name="radio"
            options={radioOptions}
            orientation="horizontal"
            state="default"
          />

          {loading && <div>Chargement des statistiques…</div>}
          {error && <div style={{ color: 'red' }}>Erreur chargement stats : {error.message}</div>}

          {!loading && !error && datasCard.length > 0 && (
            <div className={styles.cardsSection}>
              {datasCard.map((card) => (
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
            inputTitle="toggle-period"
            label="Utiliser une période donnée"
            labelPosition="left"
            checked={isToogleActive}
            onChange={() => setIsToogleActive(v => !v)}
          />
          {isToogleActive && (
            <div className={styles.hiddenBlock}>
              <div className={styles.separator} />
              <div className={styles.hiddenPeriodBlock}>
                <Input label="Date de début" nativeInputProps={{ type: 'date' }} />
                <Input label="Date de fin" nativeInputProps={{ type: 'date' }} />
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
