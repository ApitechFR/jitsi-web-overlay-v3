import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './useAuth';
import CircularProgress from '@mui/material/CircularProgress';
import { validateConferenceName } from '@/utils/conferenceName';

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { authenticated, status } = useAuth();
  const location = useLocation();

  if (status === 'unknown') {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
        <CircularProgress style={{ height: '150px', width: '150px' }} />
      </div>
    );
  }

  if (!authenticated) {
    const allowGuest = Boolean((location.state as any)?.allowGuest);
    const path = location.pathname.replace(/\/+$/, '');
    const segs = path.split('/').filter(Boolean);
    const waitForRoom = segs.length === 1 ? segs[0] : undefined;

    // On autorise l'invité uniquement pour une route de type "/:roomName"
    if (allowGuest && waitForRoom) {
      return <>{children}</>;
    }

    // Sinon: redirection habituelle vers la Home
    // Valide le nom de la conférence avant de rediriger
    const isValidRoom = waitForRoom && validateConferenceName(waitForRoom).isValidConfName;

    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location,
          // Si le nom est valide, on lance le polling (waitForRoom)
          // Si invalide, on pré-remplit le champ avec le nom invalide (prefillRoomName)
          ...(isValidRoom ? { waitForRoom } : waitForRoom && { prefillRoomName: waitForRoom }),
          openAuthModal: isValidRoom,
        }}
      />
    );
  }

  return <>{children}</>;
}