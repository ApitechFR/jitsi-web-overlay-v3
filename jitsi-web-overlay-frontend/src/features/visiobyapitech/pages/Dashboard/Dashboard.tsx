import styles from './Dashboard.module.css';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@apitechfr/react-dsapitech/Breadcrumb';
import { SideMenu } from "@apitechfr/react-dsapitech/SideMenu";

import { useState } from 'react';
import RealTime from '../../components/Dashboard/RealTime';
import HistoricTasks from '../../components/Dashboard/HistoricTasks';
import SurveyResults from '../../components/Dashboard/SurveyResults';


function Dashboard() {
  const { t } = useTranslation();

  const [activeView, setActiveView] = useState<"realtime" | "historic" | "survey">("realtime");

  const handleDashboardChange = (view: "realtime" | "historic" | "survey") => {
    setActiveView(view);
  }

  const renderDashboardComponent = () => {
    switch (activeView) {
      case "realtime": {
        return <RealTime />;
      }

      case "historic": {
        return <HistoricTasks />;
      }

      case "survey": {
        return <SurveyResults />;
      }

      default:
        return null;
    }
  }

  return (
    <div className={styles.contentDashboard}>
      <div className={styles.breadcrumbContainer}>
        <Breadcrumb
          currentPageLabel={t('dashboard.breadcrumb')}
          homeLinkProps={{
            href: '/'
          }}
          segments={[]}
        />
      </div>
      <section className={styles.content}>
        <aside
          className={styles.asideContainer}
        >
          <SideMenu
            align="left"
            burgerMenuButtonText=""
            items={[
              {
                isActive: activeView === 'realtime',
                linkProps: {
                  href: '#',
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    handleDashboardChange('realtime');
                  }
                },
                text: t('dashboard.realtime')
              },
              {
                isActive: activeView === 'historic',
                linkProps: {
                  href: '#',
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    handleDashboardChange('historic');
                  }
                },
                text: t('dashboard.historic')
              },
              {
                isActive: activeView === 'survey',
                linkProps: {
                  href: '#',
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    handleDashboardChange('survey');
                  }
                },
                text: t('dashboard.survey')
              },
            ]}
            title=""
          />
        </aside>
        <main className={styles.mainDashboardContent}>
          <h1 className={styles.title}>{t('dashboard.title')}</h1>
          <div className={styles.dashboardComponent}>
            {renderDashboardComponent()}
          </div>
        </main>
      </section>
    </div>
  )
}

export default Dashboard;