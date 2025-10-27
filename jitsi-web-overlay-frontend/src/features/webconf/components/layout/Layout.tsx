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

interface HeaderProps {
    readonly authenticated: boolean | null;
    readonly setAuthenticated: (e: boolean) => void;
    readonly setError: (obj: errorObj) => void;
}
export default function Layout() {
    return (
        <div className={styles.layout}>
            <header>
                {/* <Header {...props} /> */}
                <Header />
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
