import { useEffect, useState } from 'react';
import styles from './Login.module.css';
import api from '../../axios/axios';
import { useNavigate } from 'react-router';
import CircularProgress from '@mui/material/CircularProgress';
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
  console.log('[LoginCallback] Component mounted');

  const [popupError, setPopupError] = useState<string | null>(null);

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const stateFromUrl = urlParams.get('state');
    const stateStored = sessionStorage.getItem('oidc_state');
    console.log(
      '[LoginCallback] URL params:',
      Object.fromEntries(urlParams.entries())
    );
    console.log(
      '[LoginCallback] stateFromUrl:',
      stateFromUrl,
      'stateStored:',
      stateStored
    );
    if (urlParams.get('error_description')) {
      console.warn('[LoginCallback] error_description detected, navigating -2');
      navigate(-2);
      return;
    }
    if (stateFromUrl !== stateStored) {
      console.error(
        '[LoginCallback] State mismatch:',
        stateFromUrl,
        stateStored
      );
      setError({
        message: "Erreur d'authentification (state mismatch)",
        error: { status: '401', stack: '' },
      });
      setPopupError("Erreur d'authentification (state mismatch)");
      return;
    }
    // Nettoie le state après usage
    sessionStorage.removeItem('oidc_state');
    console.log(
      '[LoginCallback] Calling backend /authentication/login_callback',
      {
        code: urlParams.get('code'),
        state: stateFromUrl,
      }
    );
    api
      .get(
        `/authentication/login_callback?code=${urlParams.get(
          'code'
        )}&state=${stateFromUrl}`
      )
      .then(res => {
        console.log('[LoginCallback] Backend response:', res.data);
        if (res.data.roomName && res.data.jwt) {
          localStorage.setItem('auth', res.data.accessToken);
          setAuthenticated(true);
          console.log(
            '[LoginCallback] Authenticated, redirecting to room:',
            res.data.roomName
          );
          navigate(`/${res.data.roomName}?jwt=${res.data.jwt}`);
          return;
        }
        if (res.data.jwt) {
          localStorage.setItem('auth', res.data.accessToken);
          setAuthenticated(true);
          console.log('[LoginCallback] Authenticated, redirecting to /');
          navigate(`/`);
          return;
        } else {
          console.warn('[LoginCallback] No jwt in response, redirecting to /');
          navigate(`/`);
        }
      })
      .catch(error => {
        localStorage.setItem('auth', 'false');
        let status = '500';
        const message = "Erreur d'authentification";
        if (error.response) {
          status = error.response.status?.toString() || '';
          console.error(
            '[LoginCallback] Backend error response:',
            error.response
          );
        } else if (error.request) {
          status = '400';
          console.error(
            '[LoginCallback] Backend error request:',
            error.request
          );
        } else {
          console.error('[LoginCallback] Backend error:', error);
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
