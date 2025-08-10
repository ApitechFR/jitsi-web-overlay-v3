import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './useAuth';

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth();
  const location = useLocation();

  if (!authenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
