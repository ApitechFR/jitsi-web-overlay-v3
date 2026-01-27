import styles from './LayoutJoona.module.css';
import Header from '../Header/HeaderJoona';
import Footer from '../Footer/FooterJoona';
import { Outlet } from 'react-router-dom';

import {
  Display,
  headerFooterDisplayItem,
} from '@ds';

import { apitechHeaderFooterDisplayItem } from '@apitechfr/react-dsapitech/Display/Display';
import { useTranslation } from 'react-i18next';

type errorObj = {
  message: string;
  error: { status: string; stack: string };
};


export default function LayoutJoona() {

    const { t } = useTranslation();
  
  return (
    <div className={styles.layout}>
      <header>
        <Header />
      </header>
      <main>
        <div className="fr-container">
          <Outlet />
        </div>
      </main>
      <footer className={styles.footer}>

        <Footer
          apitechHeaderFooterDisplayItem={apitechHeaderFooterDisplayItem({
            "display settings": t('footer.displaySettings'),
            "close": t('footer.close'),
            "pick a theme": t('footer.pickATheme'),
            "light theme": t('footer.lightTheme'),
            "dark theme": t('footer.darkTheme'),
            "system theme": t('footer.systemTheme'),
            "system theme hint": t('footer. systemThemeHint')
          })}
        />

      </footer>
      <Display />
    </div>
  );
}
