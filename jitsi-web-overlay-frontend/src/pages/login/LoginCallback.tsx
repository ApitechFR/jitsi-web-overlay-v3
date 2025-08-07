import { useEffect, useState } from 'react';
import styles from './Login.module.css';
import api from '../../axios/axios';
import { useNavigate } from 'react-router';
import ErrorPopup from '../../components/error/ErrorPopup';

interface LoginCallbackProps {
  setAuthenticated: (bool: boolean) => void;
  setError: (obj: {
    message: string;
    error: { status: string; stack: string };
  }) => void;
}

export default function LoginCallback({
  setAuthenticated,
  setError,
}: LoginCallbackProps) {
  const navigate = useNavigate();

  const [popupError, setPopupError] = useState<string | null>(null);

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const stateFromUrl = urlParams.get('state');
    const stateStored = sessionStorage.getItem('oidc_state');

    if (urlParams.get('error_description')) {
      navigate(-2);
      return;
    }
    if (stateFromUrl !== stateStored) {
      setError({
        message: "Erreur d'authentification (state mismatch)",
        error: { status: '401', stack: '' },
      });
      setPopupError("Erreur d'authentification (state mismatch)");
      return;
    }
    // Nettoie le state après usage
    sessionStorage.removeItem('oidc_state');
    const apiUrl = `/authentication/login_callback?code=${urlParams.get(
      'code'
    )}&state=${stateFromUrl}`;

    api
      .get(apiUrl)
      .then(res => {
        if (res.data.roomName && res.data.jwt) {
          setAuthenticated(true);
          navigate(`/${res.data.roomName}?jwt=${res.data.jwt}`);
          return;
        }
        if (res.data.jwt) {
          setAuthenticated(true);
          navigate(`/`);
        } else {
          navigate(`/`);
        }
      })
      .catch(error => {
        let status = '500';
        const message = "Erreur d'authentification";
        if (error.response) {
          status = error.response.status?.toString() || '';
        } else if (error.request) {
          status = '400';
        }
        setError({
          message,
          error: { status, stack: '' },
        });
        const authMode = import.meta.env.VITE_AUTH_MODE ?? 'oidc';
        if (authMode === 'oidc') {
          setPopupError(message);
        } else {
          navigate('/error');
        }
      });
  }, [navigate, setAuthenticated, setError]);

  return (
    <div className={styles.home}>
      {/* <div className={styles.progress}>
        <CircularProgress style={{ height: '300px', width: '300px' }} />
      </div> */}
      {popupError && <ErrorPopup message={popupError} />}
    </div>
  );
}
