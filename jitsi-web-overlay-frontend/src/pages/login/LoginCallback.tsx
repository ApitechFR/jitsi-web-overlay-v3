import { useEffect } from 'react';
import styles from './Login.module.css';
import api from '../../axios/axios';
import { useNavigate } from 'react-router';
import CircularProgress from '@mui/material/CircularProgress';

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
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  useEffect(() => {
    if (urlParams.get('error_description')) {
      navigate(-2);
    }
    api
      .get(
        `/authentication/login_callback?code=${urlParams.get(
          'code'
        )}&state=${urlParams.get('state')}`
      )
      .then(res => {
        if (res.data.roomName && res.data.jwt) {
          navigate(`/${res.data.roomName}?jwt=${res.data.jwt}`);
          localStorage.setItem('auth', res.data.accessToken);
          setAuthenticated(true);
        } else {
          navigate(`/`);
        }
      })
      .catch(error => {
        localStorage.setItem('auth', 'false');
        if (error.response) {
          setError({
            message: "erreur d'authentification",
            error: { status: '', stack: '' },
          });
          navigate('/error');
        } else {
          if (error.request) {
            setError({
              message: "erreur d'authentification",
              error: { status: '400', stack: '' },
            });
            navigate('/error');
          } else {
            setError({
              message: "erreur d'authentification",
              error: { status: '500', stack: '' },
            });
            navigate('/error');
          }
        }
      });
  }, []);

  return (
    <div className={styles.home}>
      <div className={styles.progress}>
        <CircularProgress style={{ height: '300px', width: '300px' }} />
      </div>
    </div>
  );
}
