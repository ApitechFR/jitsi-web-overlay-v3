import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import JitsiMeetingView from './JitsiMeetingView';
import { validateConferenceName } from '@/utils/conferenceName';
import CircularProgress from '@mui/material/CircularProgress';
import Header from '../../components/Header/HeaderVisio';
import styles from './JitsiMeetWrapper.module.css';
import { ConferenceService, useApi } from '@/api';
import { useRuntimeConfig } from '@/config/ConfigProvider';

interface JitsiMeetWrapperProps {
  conferenceName?: string;
  jwt?: string;
  displayName?: string;
  user?: any;
  isWebinarInvite?: boolean;
}

const JitsiMeetWrapper: React.FC<JitsiMeetWrapperProps> = (props) => {
  const { t } = useTranslation();
  // If props.conferenceName is provided, use it; else fallback to route param
  const routeParams = useParams();
  const conferenceName = props.conferenceName || routeParams.conferenceName;
  const navigate = useNavigate();
  const location = useLocation() as { state?: any };
  const { authenticated, status, user: authUser } = useAuth();
  const [jwtToken, setJwtToken] = useState<string | undefined>(props.jwt);
  const [jwtError, setJwtError] = useState<string | null>(null);
  const { run: fetchJitsiJwt, loading: loadingJitsiJwt, error: errorJitsiJwt } = useApi(ConferenceService.jitsiJwt);
  const cfg = useRuntimeConfig();
  const domain = cfg.VITE_JITSI_DOMAIN as string;
  const validRoom = !!conferenceName && validateConferenceName(conferenceName);

  // If props.jwt is not provided, fetch JWT as before (classic mode)
  useEffect(() => {
    if (props.jwt || props.isWebinarInvite) return;
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
  }, [validRoom, status, authenticated, conferenceName, navigate, location.state, props.jwt, props.isWebinarInvite]);

  useEffect(() => {
    if (props.jwt || props.isWebinarInvite) return;
    if (!validRoom) return;
    if (status === 'unknown') return;
    if (!authenticated) return;
    setJwtError(null);
    fetchJitsiJwt(conferenceName)
      .then(resp => {
        setJwtToken(resp.token);
      })
      .catch(e => {
        setJwtToken(undefined);
        setJwtError(e?.message || 'Impossible de récupérer le JWT pour cette conférence.');
      });
  }, [authenticated, status, conferenceName, validRoom, fetchJitsiJwt, props.jwt, props.isWebinarInvite]);

  // displayName : on privilégie prénom/nom/email si présents, else use props.displayName
  const displayName = useMemo<string>(() => {
    if (props.displayName) return props.displayName;
    if (authenticated) {
      const first =
        (authUser as any)?.given_name ||
        (authUser as any)?.firstName ||
        (authUser as any)?.prenom ||
        '';
      const last =
        (authUser as any)?.family_name ||
        (authUser as any)?.lastName ||
        (authUser as any)?.nom ||
        '';
      const full = [first, last].filter(Boolean).join(' ').trim();
      if (full) return full;
      if (typeof (authUser as any)?.name === 'string' && (authUser as any)?.name) return (authUser as any).name;
      if (typeof (authUser as any)?.email === 'string' && (authUser as any)?.email) return (authUser as any).email;
      if (jwtToken) return t('jitsiMeetWrapper.connectedUser');
    }
    return t('jitsiMeetWrapper.guest');
  }, [authenticated, authUser, jwtToken, props.displayName, t]);

  // GARDES
  if (!validRoom) return null;
  if (status === 'unknown' && !props.isWebinarInvite) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress style={{ height: '150px', width: '150px' }} />
      </div>
    );
  }

  if (!props.jwt && !props.isWebinarInvite) {
    if (authenticated && loadingJitsiJwt && !jwtToken) {
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
            {t('jitsiMeetWrapper.contactAdmin')}
          </div>
        </div>
      );
    }
  }

  return (
    <>
      <div className={styles.headerContainer}>
        <Header />
      </div>
      <div className={styles.jitsiMeetingContainer}>
        <JitsiMeetingView
          domain={domain}
          conferenceName={conferenceName}
          jwt={jwtToken || props.jwt}
          displayName={displayName}
          user={props.user === undefined ? authUser : props.user}
        />
      </div>
    </>
  );
};

export default JitsiMeetWrapper;
