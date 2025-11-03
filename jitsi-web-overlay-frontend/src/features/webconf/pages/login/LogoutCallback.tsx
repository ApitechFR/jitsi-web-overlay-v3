import { useEffect } from 'react';
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';

export default function LogoutCallback() {
  const navigate = useNavigate();

  useEffect(() => {

    sessionStorage.removeItem('oidc_state');

    const timeout = setTimeout(() => {
      navigate('/', { replace: true });
    }, 500);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className={styles.home}>
      <div className={styles.progress}>
        <CircularProgress style={{ height: 150, width: 150 }} />
      </div>
    </div>
  );
}
