import { Navigate, useLocation, useParams } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './useAuth';
import CircularProgress from '@mui/material/CircularProgress';
import { validateConferenceName } from '@/utils/conferenceName';

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { authenticated, status } = useAuth(); // status: 'unknown' | 'authenticated' | 'unauthenticated'
  const location = useLocation();
  const { conferenceName } = useParams();

  const allowGuest = Boolean((location.state as any)?.allowGuest);
  const path = location.pathname.replace(/\/+$/, '');
  const segs = path.split('/').filter(Boolean);
  const waitForRoom = segs.length === 1 ? segs[0] : undefined;


  if (status === 'unknown') {
    return <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}><CircularProgress /></div>;
  }

  if (conferenceName && !validateConferenceName(conferenceName)) {
    return (
      <Navigate
        to="/"
        replace
        state={{ prefillconferenceName: conferenceName }}
      />
    );
  }

  if (!authenticated && allowGuest && waitForRoom) {
    return <>{children}</>;
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location, ...(waitForRoom ? { waitForRoom } : {}), openAuthModal: true }}
      />
    );
  }

  return <>{children}</>;
}
