import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/useAuth';
import JitsiMeetingView from './JitsiMeetingView';
import{ validateRoomName}from '../../../utils/roomName';


type JwtResponse = { jwt?: string; error?: string };

async function fetchJitsiJwtWithBearer(apiBase: string, roomName: string, token: string): Promise<JwtResponse> {
 // const { user } = useAuth();

  //console.log(user);
  const body = { roomName};
  const res = await fetch(`${apiBase}/conferences/jitsi-jwt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    return { error: `Bearer fetch failed: ${res.status}` };
  }
  return res.json();
}

async function fetchJitsiJwtWithSession(apiBase: string, roomName: string): Promise<JwtResponse> {
  //const { user } = useAuth();
  //console.log(user);
  const body = { roomName };
  const res = await fetch(`${apiBase}/conferences/jitsi-jwt`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    return { error: `Session fetch failed: ${res.status}` };
  }
  return res.json();
}

const JitsiMeetWrapper: React.FC = () => {
  const { roomName } = useParams();
  const { authenticated, token, user } = useAuth();

  const [jwtToken, setJwtToken] = useState<string | undefined>(undefined);
  const [jwtError, setJwtError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const domain = import.meta.env.VITE_JITSI_DOMAIN; 
  const apiBase = import.meta.env.VITE_API_URL;

  const validRoom = roomName && validateRoomName(roomName);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!authenticated) {
        
        setJwtToken(undefined);
        setJwtError(null);
        return;
      }
      if (!validRoom) return;

      setLoading(true);
      setJwtError(null);

      try {
        let firstTry: JwtResponse | null = null;
        let secondTry: JwtResponse | null = null;

        // 1) Si on a un token → tenter le flux Bearer d'abord
        if (token) {
          try {
            firstTry = await fetchJitsiJwtWithBearer(apiBase, roomName!, token);
          } catch (e) {
            firstTry = { error: `Bearer exception: ${(e as Error).message}` };
          }
        }

        // 2) Si pas de token, ou si Bearer échoue → tenter la session
        if (!token || firstTry?.error || !firstTry?.jwt) {
          try {
            secondTry = await fetchJitsiJwtWithSession(apiBase, roomName!);
          } catch (e) {
            secondTry = { error: `Session exception: ${(e as Error).message}` };
          }
        }

        const picked = firstTry?.jwt ? firstTry : secondTry;

        if (!cancelled) {
          if (picked?.jwt) {
            setJwtToken(picked.jwt);
            setJwtError(null);
          } else {
            
            const bearerMsg = firstTry?.error ? ` (Bearer: ${firstTry.error})` : '';
            const sessionMsg = secondTry?.error ? ` (Session: ${secondTry.error})` : '';
            setJwtToken(undefined);
            setJwtError(
              token
                ? `Impossible de récupérer le JWT pour cette conférence.${bearerMsg || ''}${sessionMsg || ''}`
                : `Impossible de récupérer le JWT via la session.${sessionMsg || ''}`
            );
          }
        }
      } finally {
        !cancelled && setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [authenticated, token, roomName, apiBase, validRoom]);

  // DisplayName cohérent (prend le nom du user s'il existe)
  const displayName = useMemo<string>(() => {
    if (authenticated) {
      if (typeof user?.given_name === 'string' && user.given_name) return user.given_name;
      if (typeof user?.name === 'string' && user.name) return user.name;
      if (typeof user?.email === 'string' && user.email) return user.email;
      if (jwtToken) return 'Utilisateur connecté';
    }
    return 'Invité';
  }, [authenticated, user, jwtToken]);

  if (!validRoom) return null;

  
  if (authenticated && loading && !jwtToken) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement de la conférence…</div>;
  }

  if (authenticated && jwtError && !jwtToken) {
    return (
      <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>
        {jwtError}
        <div style={{ marginTop: 8, color: '#666' }}>
          Si le problème persiste, contactez l'administrateur de la conférence.
        </div>
      </div>
    );
  }

  return (
    <JitsiMeetingView
      domain={domain}
      roomName={roomName!}
      jwt={jwtToken}
      displayName={displayName}
    />
  );
};

export default JitsiMeetWrapper;
