import styles from './LayoutJoona.module.css';
import Header from '../header/HeaderJoona';
import Footer from '../footer/FooterJoona';
import { Outlet } from 'react-router-dom';

import {
  Display,
  headerFooterDisplayItem,
} from '@apitechfr/react-dsapitech/Display';

type errorObj = {
  message: string;
  error: { status: string; stack: string };
};


export default function LayoutJoona() {
  return (
    <div className={styles.layout}>
      <header>
        <Header  />
      </header>
      <main>
        <div className="fr-container">
          <Outlet />
        </div>
      </main>
      <footer className={styles.footer}>

        <Footer
          headerFooterDisplayItem={headerFooterDisplayItem}
        />

      </footer>
      <Display />
    </div>
  );
}
