import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './useAuth';
import CircularProgress from '@mui/material/CircularProgress';

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { authenticated, status } = useAuth();
  const location = useLocation();


  if (status === 'unknown') {
    return (
      <div >
        <CircularProgress style={{ height: '150px', width: '150px' }} />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
