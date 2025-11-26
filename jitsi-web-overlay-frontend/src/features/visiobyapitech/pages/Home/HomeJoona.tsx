
import { generateConferenceName, validateConferenceName } from '../../../../utils/conferenceName';
import { useState, useRef, FormEvent, useEffect, useMemo } from 'react';
import styles from './HomeJoona.module.css';
import { Button } from '@apitechfr/react-dsapitech/Button';
import { Input } from '@apitechfr/react-dsapitech/Input';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert } from '@apitechfr/react-dsapitech/Alert';
import { createModal } from '@apitechfr/react-dsapitech/Modal';
import { useIsModalOpen } from '@apitechfr/react-dsapitech/Modal/useIsModalOpen';
import { useAuth } from '../../../../auth/useAuth';
import { useRuntimeConfig } from '../../../../config/ConfigProvider';
import { useConferencePolling } from '../../hooks/useConferencePolling';
import { ConferenceWaitingModal } from './ConferenceWaitingModal';

interface HomeJoonaProps {
  readonly conferenceName: string;
  readonly setConferenceName: (conferenceName: string) => void;
  readonly setIsWhitelisted: (value: boolean | null) => void;
  readonly isWhitelisted: boolean | null;
  readonly email: string;
  readonly setEmail: (email: string) => void;
  readonly sendEmail: (conferenceName: string) => void;
  readonly joinConference?: (conferenceName: string) => void;
  readonly conferenceNumber: number;
  readonly participantNumber: number;
}

const POLLING_INTERVAL = 2000; // 2s

function HomeJoona(props: HomeJoonaProps) {
  const cfg = useRuntimeConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isError, setIsError] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  // Timer pour le délai supplémentaire de 2s avant d’ouvrir le modal
  const extraDelayTimerRef = useRef<number | null>(null);

  const isValidConferenceName = (name: string) => validateConferenceName(name);

  const { authenticated, login } = useAuth();

  // pour intercepter toute fermeture de modal
  const stopRef = useRef<null | ((byModalClose?: boolean) => void)>(null);

  const originalCloseRef = useRef<() => void>();

  // Polling 
  const {
    runFirstCheckThenMaybeWait,
    stopPolling,
  } = useConferencePolling({
    isValidConferenceName,
    onConferenceStarted: (room) => {
      if (authenticated) {
        navigate(`/${room}`, { replace: true });
      } else {
        navigate(`/${room}`, { replace: true, state: { allowGuest: true } });
      }
    },
    onWaitingStart: () => setTimeout(() => modal.open(), 0),
    pollingInterval: POLLING_INTERVAL,
  });

  useEffect(() => {
    if (isAlertVisible) {
      const timeout = setTimeout(() => setIsAlertVisible(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isAlertVisible]);

  const modal = useMemo(
    () => createModal({ id: 'auth-modal', isOpenedByDefault: false }),
    []
  );

  useIsModalOpen(modal, {
    onConceal: () => stopWaitingAndPoll(true),
  });
  // Arrêter l’attente AVANT de fermer
  useEffect(() => {
    const originalClose = modal.close;
    originalCloseRef.current = originalClose;
    (modal as any).close = () => {
      try {
        if (stopRef.current) stopRef.current(true);
      } catch { }
      originalClose();
    };
    return () => { (modal as any).close = originalClose; };
  }, [modal]);


  // Met à jour l'état d'erreur dès que le nom change (affiche l'erreur si invalide, la retire si valide)
  useEffect(() => {
    setIsError(!!props.conferenceName && !isValidConferenceName(props.conferenceName));
  }, [props.conferenceName, isValidConferenceName]);

  const stopWaitingAndPoll = (byModalClose?: boolean) => {
    stopPolling();
    if (extraDelayTimerRef.current) {
      clearTimeout(extraDelayTimerRef.current);
      extraDelayTimerRef.current = null;
    }
    if (!byModalClose) {
      try { originalCloseRef.current?.(); } catch { }
    }
  };
  stopRef.current = stopWaitingAndPoll;

  useEffect(() => {
    return () => {
      if (extraDelayTimerRef.current) {
        clearTimeout(extraDelayTimerRef.current);
        extraDelayTimerRef.current = null;
      }
    };
  }, []);

  //  Navigation state
  useEffect(() => {
    const st = (location.state || {}) as {
      prefillRoomName?: string;
      waitForRoom?: string;
      openAuthModal?: boolean;
    };

    if (st.prefillRoomName) {
      const nm = st.prefillRoomName.trim();
      props.setConferenceName(nm);
      setIsError(!validateConferenceName(nm));
      setTimeout(() => inputRef.current?.focus(), 0);
      navigate('.', { replace: true, state: {} });
      return;
    }

    if (st.waitForRoom) {
      const target = st.waitForRoom;
      if (props.conferenceName !== target) props.setConferenceName(target);
      runFirstCheckThenMaybeWait(target);
      navigate('.', { replace: true, state: {} });
      return;
    }

    if (st.openAuthModal && !authenticated) {
      const target = st.waitForRoom ?? props.conferenceName;
      if (target && target !== props.conferenceName) props.setConferenceName(target);
      runFirstCheckThenMaybeWait(target);
      navigate('.', { replace: true, state: {} });
      return;
    }
  }, [location.state, authenticated, navigate, props.conferenceName, props.setConferenceName]);

  const onCopyLink = () => {
    if (!props.conferenceName || !isValidConferenceName(props.conferenceName)) return;
    const textToCopy = `${window.location.origin}/${props.conferenceName}`;
    navigator.clipboard.writeText(textToCopy).then(() => setIsAlertVisible(true));
  };

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidConferenceName(props.conferenceName)) {
      setIsError(true);
      return;
    }
    setIsError(false);

    if (authenticated) {
      stopWaitingAndPoll();
      navigate(`/${props.conferenceName}`);
      return;
    }

    // invité : premier check via backend, puis éventuel waiting + poll
    runFirstCheckThenMaybeWait(props.conferenceName);
  }

  const handleGenerateRoomName = () => {
    props.setConferenceName(generateConferenceName());
  };

  return (
    <div className={styles.homeContainer}>

      {/* {phase === 'first-check' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.75)',
            zIndex: 9999
          }}
          aria-live="polite"
          aria-busy="true"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <CircularProgress />
            <div style={{ color: '#444', fontSize: 14 }}>Vérification de la conférence…</div>
          </div>
        </div>
      )} */}

      <ConferenceWaitingModal
        modal={modal}
        authenticated={authenticated}
        stopWaitingAndPoll={stopWaitingAndPoll}
        login={login}
        conferenceName={props.conferenceName}
        validateConferenceName={validateConferenceName}
      />

      <div className={styles.firstContainer}>
        <div className={styles.homeContent}>
          <h1 className={styles.homeTitle}>Rejoindre une visioconférence</h1>
          <div className={styles.inputsRoom}>
            <div className={styles.joinPart}>
              <Input
                label=""
                id="conferenceName"
                state={isError ? 'error' : 'default'}
                nativeInputProps={{
                  placeholder: 'Saisissez votre nom de conférence',
                  value: props.conferenceName,
                  onChange: e => {
                    const value = e.currentTarget.value;
                    props.setConferenceName(value);
                    setIsError(!isValidConferenceName(value));
                  },
                  ref: inputRef,
                }}
                stateRelatedMessage={
                  isError && (cfg.VITE_CONFERENCE_NAME_REGEX_MESSAGE || 'Nom de conférence invalide.')
                }
                style={{ width: '100%' }}
                addon={
                  <Button className={styles.plusButton} onClick={handleGenerateRoomName} type="button">
                    <ShuffleIcon />
                  </Button>
                }
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button onClick={onSubmit} className={styles.joinButton} style={{ width: '100%' }}>
              <span>Rejoindre ou créer</span>
            </Button>

            <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
              <Button onClick={onCopyLink} priority="tertiary">
                Copier le lien
                <i className="fr-icon-clipboard-line fr-btn--icon-right" aria-hidden="true"></i>
              </Button>
              {isAlertVisible && (
                <div className={styles.alertContainer}>
                  <Alert severity="success" title="Lien copié avec succès !" description="" small />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.secondContainer}>
        <img
          src="/assets/illustration_homepage_visio_by_apitech.svg"
          alt="Image page d’accueil"
        />
      </div>
    </div>
  );
}
export default HomeJoona;