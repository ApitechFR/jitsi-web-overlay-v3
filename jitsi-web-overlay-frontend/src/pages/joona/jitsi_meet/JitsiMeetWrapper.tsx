import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import JitsiMeetingView from './JitsiMeetingView';
import { validateRoomName } from '../../../utils/roomName';
import CircularProgress from '@mui/material/CircularProgress';
import Header from '../../../components/joona/header/HeaderVisio';
import styles from './JitsiMeetWrapper.module.css'

type JwtResponse = | { token: string; exp?: number; moderator: boolean } | { error: string };

async function fetchJitsiJwtWithSession(
  apiBase: string,
  roomName: string,
  signal?: AbortSignal
): Promise<JwtResponse> {
  const url = `${apiBase}/conferences/${encodeURIComponent(roomName)}/tokens/jitsi`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ /* rien: le serveur décide du rôle/TTL */ }),
      signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { error: `HTTP ${res.status}${text ? ` – ${text}` : ''}` };
    }

    return res.json();
  } catch (e: any) {
    if (e?.name === 'AbortError') return { error: 'Request aborted' };
    return { error: e?.message ?? 'Network error' };
  }
}

const JitsiMeetWrapper: React.FC = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as { state?: any };
  const { authenticated, status, user } = useAuth();

  const [jwtToken, setJwtToken] = useState<string | undefined>(undefined);
  const [jwtError, setJwtError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isHeaderOpen, setIsHeaderOpen] = useState(false);

  const domain = import.meta.env.VITE_JITSI_DOMAIN as string;
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

  const validRoom = !!roomName && validateRoomName(roomName);

  useEffect(() => {
    if (!validRoom) return;
    if (status === 'unknown') return;
    if (!authenticated) {
      const allowGuest = Boolean(location.state?.allowGuest);
      if (!allowGuest) {
        navigate('/', {
          replace: true,
          state: { waitForRoom: roomName, openAuthModal: true },
        });
      }
    }
  }, [validRoom, status, authenticated, roomName, navigate, location.state]);

  // Récup JWT uniquement si connecté
  useEffect(() => {
    if (!validRoom) return;
    if (status === 'unknown') return;
    if (!authenticated) return;

    let cancelled = false;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 10000);

    (async () => {
      setLoading(true);
      setJwtError(null);
      try {
        const resp = await fetchJitsiJwtWithSession(apiBase, roomName!, ctrl.signal);
        if (cancelled) return;

        if ('token' in resp) {
          setJwtToken(resp.token);
        } else {
          setJwtToken(undefined);
          setJwtError(resp.error || 'Impossible de récupérer le JWT pour cette conférence.');
        }
      } catch (e: any) {
        if (!cancelled) {
          setJwtToken(undefined);
          setJwtError(`Session exception: ${e?.message ?? 'unknown error'}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(to);
      ctrl.abort();
    };
  }, [authenticated, status, roomName, apiBase, validRoom]);

  useEffect(() => {
    setTheme("dark");
  }, []);

  // displayName : on privilégie prénom/nom/email si présents
  const displayName = useMemo<string>(() => {
    if (authenticated) {
      const first =
        (user as any)?.given_name ||
        (user as any)?.firstName ||
        (user as any)?.prenom ||
        '';
      const last =
        (user as any)?.family_name ||
        (user as any)?.lastName ||
        (user as any)?.nom ||
        '';
      const full = [first, last].filter(Boolean).join(' ').trim();
      if (full) return full;
      if (typeof (user as any)?.name === 'string' && (user as any)?.name) return (user as any).name;
      if (typeof (user as any)?.email === 'string' && (user as any)?.email) return (user as any).email;
      if (jwtToken) return 'Utilisateur connecté';
    }
    return 'Invité';
  }, [authenticated, user, jwtToken]);

  // GARDES
  if (!validRoom) return null;
  if (status === 'unknown') {
    return (
      <div>
        <CircularProgress style={{ height: '150px', width: '150px' }} />
      </div>
    );
  }

  // Si non-auth SANS allowGuest, l’effet ci-dessus a renvoyé vers la Home.
  // Si non-auth AVEC allowGuest, on rend Jitsi sans JWT (invité).
  // Si auth, on rend Jitsi avec ou sans JWT (selon fetch en cours).

  if (authenticated && loading && !jwtToken) {
    return (
      <div>
        <CircularProgress style={{ height: '150px', width: '150px' }} />
      </div>
    );
  }

  if (authenticated && jwtError && !jwtToken) {
    return (
      <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>
        {jwtError}
        <div style={{ marginTop: 8, color: '#666' }}>
          Si le problème persiste, contactez l’administrateur de la conférence.
        </div>
      </div>
    );
  }

  function setTheme(theme: "light" | "dark") {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-fr-theme", theme);
    root.setAttribute("data-fr-scheme", theme);
  }

  return (
    <>
      <div className={`${styles.headerContainer} ${isHeaderOpen ? styles.open : ""}`}>
        <Header />
      </div>
      <div className={`${styles.iconButtonContainer} ${isHeaderOpen ? styles.openBtn : ""}`}>
        <button
          className={styles.iconButton}
          onClick={() => setIsHeaderOpen((previous) => !previous)}
        >
          {isHeaderOpen ? <span aria-hidden="true" className="fr-icon-arrow-up-s-line"></span> : <span aria-hidden="true" className="fr-icon-arrow-down-s-line"></span>}
        </button>
      </div>
      <JitsiMeetingView
        domain={domain}
        roomName={roomName!}
        jwt={jwtToken}          // undefined => invité
        displayName={displayName}
      />
    </>
  );
};

export default JitsiMeetWrapper;
