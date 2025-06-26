
import styles from './Layout.module.css';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import { Outlet } from 'react-router-dom';
import {
  Display,
  headerFooterDisplayItem,
} from '@codegouvfr/react-dsfr/Display';

type errorObj = {
  message: string;
  error: { status: string; stack: string };
};

interface headerProps {
  authenticated: boolean | null;
  setAuthenticated: (e: boolean) => void;
  setError: (obj: errorObj) => void;
}
export default function Layout(propos: headerProps) {
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
          style="footer"
          headerFooterDisplayItem={headerFooterDisplayItem}
        />
      </footer>
      <Display />
    </div>
  );
}
