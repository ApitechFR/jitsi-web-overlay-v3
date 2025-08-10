import { useEffect, useState } from 'react';
import styles from './Login.module.css';
import api from '../../axios/axios';
import { useNavigate } from 'react-router-dom';
import ErrorPopup from '../../components/error/ErrorPopup';
import { useAuth } from '../../auth/useAuth';

interface LoginCallbackProps {
  setError: (obj: {
    message: string;
    error: { status: string; stack: string };
  }) => void;
}

export default function LoginCallback({ setError }: LoginCallbackProps) {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [popupError, setPopupError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stateFromUrl = urlParams.get('state');
    const stateStored = sessionStorage.getItem('oidc_state');

    // Erreur renvoyée par le provider
    if (urlParams.get('error_description')) {
      navigate(-2);
      return;
    }

    // CSRF / state mismatch
    if (!stateFromUrl || stateFromUrl !== stateStored) {
      const message = "Erreur d'authentification (state mismatch)";
      setError({ message, error: { status: '401', stack: '' } });
      setPopupError(message);
      return;
    }

    // Nettoyage du state après usage
    sessionStorage.removeItem('oidc_state');

    const apiUrl = `/authentication/login_callback?code=${encodeURIComponent(
      urlParams.get('code') || ''
    )}&state=${encodeURIComponent(stateFromUrl)}`;

    api
      .get(apiUrl)
      .then(async res => {
        // Rafraîchir l'état global d'auth après succès
        await refresh();

        if (res.data?.roomName && res.data?.jwt) {
          navigate(`/${res.data.roomName}?jwt=${res.data.jwt}`);
          return;
        }
        if (res.data?.jwt) {
          navigate(`/`);
          return;
        }
        navigate(`/`);
      })
      .catch(error => {
        let status = '500';
        const message = "Erreur d'authentification";

        if (error?.response) status = error.response.status?.toString() || '500';
        else if (error?.request) status = '400';

        setError({ message, error: { status, stack: '' } });

        const authMode = import.meta.env.VITE_AUTH_MODE ?? 'oidc';
        if (authMode === 'oidc') setPopupError(message);
        else navigate('/error');
      });
  }, [navigate, refresh, setError]);

  return (
    <div className={styles.home}>
      {popupError && <ErrorPopup message={popupError} />}
    </div>
  );
}
