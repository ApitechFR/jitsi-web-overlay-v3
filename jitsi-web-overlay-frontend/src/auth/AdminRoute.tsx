import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './useAuth';
import { isUserAdmin } from '../utils/userInfos';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { authenticated, user } = useAuth();
  const location = useLocation();

  if (!authenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  if (!isUserAdmin(user)) {
    return <Navigate to="/profile" replace />;
  }
  return <>{children}</>;
}
