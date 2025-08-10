
import { useEffect, useState } from 'react';
import styles from './Login.module.css';
import api from '../../axios/axios';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../../auth/useAuth';

interface LoginCallbackProps {
  setError: (obj: { message: string; error: { status: string; stack: string } }) => void;
}

export default function LoginCallback({ setError }: LoginCallbackProps) {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [statusText, setStatusText] = useState('Connexion en cours…');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const stateFromUrl = urlParams.get('state');
      const stateStored = sessionStorage.getItem('oidc_state');

      // Erreur explicite du provider
      const providerError = urlParams.get('error_description');
      if (providerError) {
        setError({ message: "Erreur d'authentification", error: { status: '401', stack: '' } });
        navigate('/', { replace: true });
        return;
      }

      // CSRF / state mismatch
      if (!code || !stateFromUrl || stateFromUrl !== stateStored) {
        setError({ message: "Erreur d'authentification (state mismatch)", error: { status: '401', stack: '' } });
        navigate('/', { replace: true });
        return;
      }

      // Nettoyage du state
      sessionStorage.removeItem('oidc_state');

      // Tentatives avec backoff court (écriture cookie, etc.)
      const maxTries = 3;
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      let lastErrorStatus = '500';

      for (let attempt = 1; attempt <= maxTries; attempt++) {
        try {
          setStatusText(attempt === 1 ? 'Établissement de la session…' : `Nouvelle tentative (${attempt}/${maxTries})…`);

          await api.get(
            `/authentication/login_callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(stateFromUrl)}`
          );

          // Rafraîchir l’état global d’auth
          await refresh();

          if (!cancelled) {
            // Si le backend renvoie room/jwt via query
            navigate('/', { replace: true });
          }
          return;
        } catch (e: any) {
          lastErrorStatus = e?.response?.status?.toString?.() || '500';
          if (attempt < maxTries) {
            await delay(300); // petit backoff (300–500ms)
            continue;
          }
        }
      }

      // Après les tentatives → afficher l’erreur
      if (!cancelled) {
        setError({ message: "Erreur d'authentification", error: { status: lastErrorStatus, stack: '' } });
        navigate('/error', { replace: true });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate, refresh, setError]);

  return (
    <div className={styles.home}>
      <div className={styles.progress}>
        <CircularProgress style={{ height: '150px', width: '150px' }} />
        <div style={{ marginTop: 16 }}>{statusText}</div>
      </div>
    </div>
  );
}
