import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './useAuth';
import CircularProgress from '@mui/material/CircularProgress';

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { authenticated, status } = useAuth();
  const location = useLocation();

  const allowGuest = Boolean((location.state as any)?.allowGuest);
  const path = location.pathname.replace(/\/+$/, '');
  const segs = path.split('/').filter(Boolean);
  const waitForRoom = segs.length === 1 ? segs[0] : undefined;

  // laisser passer les invités sur "/:roomName" même si status === 'unknown'
  if (!authenticated && allowGuest && waitForRoom) {
    return <>{children}</>;
  }

  // if (status === 'unknown') {
  //   return (
  //     <div>
  //       <CircularProgress style={{ height: 150, width: 150 }} />
  //     </div>
  //   );
  // }

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
