import styles from './LayoutJoona.module.css';
import Header from '../header/HeaderJoona';
import Footer from '../footer/FooterJoona';
import { Outlet } from 'react-router-dom';

import { Display, headerFooterDisplayItem } from "@apitechfr/react-dsapitech/Display"

type errorObj = {
  message: string;
  error: { status: string; stack: string };
};

interface headerProps {
  authenticated: boolean | null;
  setAuthenticated: (e: boolean) => void;
  setError: (obj: errorObj) => void;
}
export default function LayoutJoona(propos: headerProps) {
  return (
    <div className={styles.layout}>
      <header>
        <Header {...propos} />
      </header>
      <main>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <Footer
          // style="footer"
          // headerFooterDisplayItem={headerFooterDisplayItem}
        />
      </footer>
      <Display />
    </div>
  );
}
