import React, { useEffect } from 'react';
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

export default function LogoutCallback({
  setAuthenticated,
  setError,
}: LoginCallbackProps) {
  const navigate = useNavigate();
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  useEffect(() => {
    api
      .get(`/authentication/logout_callback?state=${urlParams.get('state')}`)
      .then(res => {
        setAuthenticated(false);
        localStorage.setItem('auth', 'false');
        navigate(`/`);
      })
      .catch(error => {
        if (error.response) {
          setError({
            message: 'erreur de déconnexion',
            error: { status: '', stack: '' },
          });
          navigate('/error');
        } else {
          if (error.request) {
            setError({
              message: 'erreur de déconnexion',
              error: { status: '', stack: '' },
            });
            navigate('/error');
          } else {
            setError({
              message: 'erreur de déconnexion',
              error: { status: '', stack: '' },
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
