import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../auth/useAuth';
import JitsiMeetingView from './JitsiMeetingView';
import { validateconferenceName } from '../../../../utils/conferenceName';
import CircularProgress from '@mui/material/CircularProgress';
import Header from '../../components/header/HeaderVisio';
import styles from './JitsiMeetWrapper.module.css';
import { useApi } from '@/api';
import { ConferenceService } from '@/api';
import { useRuntimeConfig } from '../../../../config/ConfigProvider';

type JwtResponse =
  | { token: string; exp?: number; moderator: boolean }
  | { error: string };

const JitsiMeetWrapper: React.FC = () => {
  const { conferenceName } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as { state?: any };
  const { authenticated, status, user } = useAuth();

  const [jwtToken, setJwtToken] = useState<string | undefined>(undefined);
  const [jwtError, setJwtError] = useState<string | null>(null);
  const { run: fetchJitsiJwt, loading: loadingJitsiJwt, error: errorJitsiJwt } = useApi(ConferenceService.jitsiJwt);

  const [isHeaderOpen, setIsHeaderOpen] = useState(true);

  const cfg = useRuntimeConfig();
  const domain = cfg.VITE_JITSI_DOMAIN as string;

  const validRoom = !!conferenceName && validateconferenceName(conferenceName);

  useEffect(() => {
    if (!validRoom) return;
    if (status === 'unknown') return;
    if (!authenticated) {
      const allowGuest = Boolean(location.state?.allowGuest);
      if (!allowGuest) {
        navigate('/', {
          replace: true,
          state: { waitForRoom: conferenceName, openAuthModal: true },
        });
      }
    }
  }, [validRoom, status, authenticated, conferenceName, navigate, location.state]);

  // Récup JWT uniquement si connecté
  useEffect(() => {
    if (!validRoom) return;
    if (status === 'unknown') return;
    if (!authenticated) return;

    setJwtError(null);
    fetchJitsiJwt(conferenceName!)
      .then(resp => {
        setJwtToken(resp.token);
      })
      .catch(e => {
        setJwtToken(undefined);
        setJwtError(e?.message || 'Impossible de récupérer le JWT pour cette conférence.');
      });
  }, [authenticated, status, conferenceName, validRoom, fetchJitsiJwt]);

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>

        <CircularProgress style={{ height: '150px', width: '150px' }} />
      </div>
    );
  }

  // Si non-auth SANS allowGuest, l’effet ci-dessus a renvoyé vers la Home.
  // Si non-auth AVEC allowGuest, on rend Jitsi sans JWT (invité).
  // Si auth, on rend Jitsi avec ou sans JWT (selon fetch en cours).

  if (authenticated && loadingJitsiJwt && !jwtToken) {
    console.log('Loading Jitsi JWT...');
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>

        <CircularProgress style={{ height: '150px', width: '150px' }} />
      </div>
    );
  }

  if (authenticated && (jwtError || errorJitsiJwt) && !jwtToken) {
    return (
      <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>
        {jwtError || errorJitsiJwt?.message}
        <div style={{ marginTop: 8, color: '#666' }}>
          Si le problème persiste, contactez l’administrateur de la conférence.
        </div>
      </div>
    );
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
        conferenceName={conferenceName!}
        jwt={jwtToken}          // undefined => invité
        displayName={displayName}
      />
    </>
  );
};

export default JitsiMeetWrapper;
