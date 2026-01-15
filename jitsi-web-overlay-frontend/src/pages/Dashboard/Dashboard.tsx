import styles from './Dashboard.module.css';
import { Breadcrumb, SideMenu } from '@ds';

import { useState } from 'react';
import RealTime from '../../components/Dashboard/RealTime';
import HistoricTasks from '../../components/Dashboard/HistoricTasks';
import SurveyResults from '../../components/Dashboard/SurveyResults';

function Dashboard() {

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
            currentPageLabel="Dashboard"
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
                text: 'Statistiques temps réel'
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
                text: 'Statistiques historique'
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
                text: 'Résultats sondage'
              },
            ]}
            title=""
          />
        </aside>
        <main className={styles.mainDashboardContent}>
          <h1 className={styles.title}>Dashboard</h1>
          <div className={styles.dashboardComponent}>
            {renderDashboardComponent()}
          </div>
        </main>
      </section>
    </div>
  )
}

export default Dashboard;