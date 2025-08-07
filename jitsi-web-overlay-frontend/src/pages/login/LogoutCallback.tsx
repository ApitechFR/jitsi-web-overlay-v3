import { useEffect } from 'react';
import styles from './Login.module.css';
import { useNavigate } from 'react-router';
import CircularProgress from '@mui/material/CircularProgress';

export default function LogoutCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem('state');

    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div className={styles.home}>
      <div className={styles.progress}>
        <CircularProgress style={{ height: '150px', width: '150px' }} />
      </div>
    </div>
  );
}
