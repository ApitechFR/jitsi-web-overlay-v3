import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import JitsiMeetingView from './JitsiMeetingView';
import { validateRoomName } from '../../../utils/roomName';
import CircularProgress from '@mui/material/CircularProgress';

type JwtResponse = { jwt?: string; error?: string };

async function fetchJitsiJwtWithSession(apiBase: string, roomName: string, signal?: AbortSignal): Promise<JwtResponse> {
  const res = await fetch(`${apiBase}/conferences/jitsi-jwt`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ roomName }),
    signal,
  });
  if (!res.ok) return { error: `Session fetch failed: ${res.status}` };
  return res.json();
}

const JitsiMeetWrapper: React.FC = () => {
  const { roomName } = useParams();
  const { authenticated, status, user } = useAuth();

  const [jwtToken, setJwtToken] = useState<string | undefined>(undefined);
  const [jwtError, setJwtError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const domain = import.meta.env.VITE_JITSI_DOMAIN;
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

  const validRoom = !!roomName && validateRoomName(roomName);

  useEffect(() => {
    if (!validRoom) return;

    let cancelled = false;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 10000); // 10s

    const run = async () => {
      // on attend d’abord de savoir si l’utilisateur est connecté ou non
      if (status === 'unknown') return;

      // utilisateur non connecté → pas de JWT (Jitsi en mode invité)
      if (!authenticated) {
        if (!cancelled) {
          setJwtToken(undefined);
          setJwtError(null);
          setLoading(false);
        }
        return;
      }

      // utilisateur connecté → on récupère le JWT via la session (cookies)
      setLoading(true);
      setJwtError(null);
      try {
        const resp = await fetchJitsiJwtWithSession(apiBase, roomName, ctrl.signal);
        if (cancelled) return;

        if (resp.jwt) {
          setJwtToken(resp.jwt);
          setJwtError(null);
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
    };

    run();
    return () => {
      cancelled = true;
      clearTimeout(to);
      ctrl.abort();
    };
  }, [authenticated, status, roomName, apiBase, validRoom]);

  // displayName : on privilégie les champs prénom/nom/email si présents
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

  if (!validRoom) return null;

  // pendant qu’on ne sait pas encore si on est auth ou non
  if (status === 'unknown') {
    return (
      <div >
        <CircularProgress style={{ height: '150px', width: '150px' }} />
      </div>
    );
  }

  if (authenticated && loading && !jwtToken) {
    return (
      <div >
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

  return (
    <JitsiMeetingView
      domain={domain}
      roomName={roomName}
      jwt={jwtToken}
      displayName={displayName}
    />
  );
};

export default JitsiMeetWrapper;
