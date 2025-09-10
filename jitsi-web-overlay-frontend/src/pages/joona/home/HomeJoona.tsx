import { generateRoomName, validateRoomName } from '../../../utils/roomName';
import { useState, useRef, FormEvent, useEffect, useMemo } from 'react';
import styles from './HomeJoona.module.css';
import { Button } from '@apitechfr/react-dsapitech/Button';
import { Input } from '@apitechfr/react-dsapitech/Input';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert } from '@apitechfr/react-dsapitech/Alert';
import { createModal } from '@apitechfr/react-dsapitech/Modal';
import { useAuth } from '../../../auth/useAuth';
import CircularProgress from '@mui/material/CircularProgress';


interface HomeJoonaProps {
  readonly roomName: string;
  readonly setRoomName: (roomName: string) => void;
  readonly setIsWhitelisted: (value: boolean | null) => void;
  readonly isWhitelisted: boolean | null;
  readonly email: string;
  readonly setEmail: (email: string) => void;
  readonly sendEmail: (roomName: string) => void;
  readonly joinConference?: (roomName: string) => void;
  readonly conferenceNumber: number;
  readonly participantNumber: number;
}

const POLLING_INTERVAL = 9000; // 9s
const HIDDEN_DIV_ID = 'jitsi-probe-container';

function HomeJoona(props: HomeJoonaProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isError, setIsError] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  // Phase d’attente: 'idle' | 'first-check' | 'waiting'
  const [phase, setPhase] = useState<'idle' | 'first-check' | 'waiting'>('idle');
  // Timer pour le délai supplémentaire de 2s avant d’ouvrir le modal
  const extraDelayTimerRef = useRef<number | null>(null);

  const { authenticated, login } = useAuth();

  // pour intercepter toute fermeture de modal
  const stopRef = useRef<null | ((byModalClose?: boolean) => void)>(null);

  const originalCloseRef = useRef<() => void>();

  // Polling
  const apiRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const cancelledRef = useRef(false);
  const backoffRef = useRef(POLLING_INTERVAL);
  const [isWaiting, setIsWaiting] = useState(false);
  const currentRoomRef = useRef<string>('');

  // Jitsi host normalisé
  const domainEnv = import.meta.env.VITE_JITSI_DOMAIN ?? '';
  const domain = domainEnv.replace(/^https?:\/\//i, '');

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
  const isValidRoomName = (name: string) => validateRoomName(name);

  // retire l’erreur visuelle dès que le nom devient valide
  useEffect(() => {
    if (props.roomName && isValidRoomName(props.roomName)) setIsError(false);
  }, [props.roomName]);

  // ---------- Helpers ----------
  const loadExternalApi = async (host: string) => {
    if ((window as any).JitsiMeetExternalAPI) return;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `https://${host}/external_api.js`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('failed to load external_api.js'));
      document.body.appendChild(s);
    });
  };

  const createOrGetHiddenDiv = () => {
    let el = document.getElementById(HIDDEN_DIV_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = HIDDEN_DIV_ID;
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.overflow = 'hidden';
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
    }
    return el;
  };

  const disposeProbe = () => {
    try { apiRef.current?.dispose?.(); } catch { }
    apiRef.current = null;
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleNext = () => {
    if (cancelledRef.current) return;
    const room = currentRoomRef.current;
    if (!room || !isValidRoomName(room)) return;
    backoffRef.current = Math.min(backoffRef.current + 3000, 30000);
    timerRef.current = window.setTimeout(() => probeOnce(room), backoffRef.current) as unknown as number;
  };


  // Premier check silencieux (2.5s max). Renvoie true si conf déjà lancée.
  const firstCheckRoomStarted = async (room: string): Promise<boolean> => {
    if (!isValidRoomName(room)) return false;
    try {
      await loadExternalApi(domain);
      const parentNode = createOrGetHiddenDiv();
      const ExternalAPI = (window as any).JitsiMeetExternalAPI;

      return await new Promise<boolean>((resolve) => {
        let resolved = false;
        const api = new ExternalAPI(domain, {
          roomName: room,
          parentNode,
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            prejoinConfig: { enabled: false },
          },
          interfaceConfigOverwrite: { TOOLBAR_BUTTONS: [] },
          userInfo: { displayName: 'Invité' },
        });

        const cleanup = () => {
          try { api.removeEventListener('videoConferenceJoined', onJoined); } catch { }
          try { api.removeEventListener('connectionFailed', onConnFailed); } catch { }
          try { api.dispose(); } catch { }
        };

        const onJoined = () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(true);
          }
        };
        const onConnFailed = () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(false);
          }
        };

        api.addEventListener('videoConferenceJoined', onJoined);
        api.addEventListener('connectionFailed', onConnFailed);

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve(false);
          }
        }, 2500);
      });
    } catch {
      return false;
    }
  };

  // Probe itératif (avec modale)
  const probeOnce = async (room: string) => {
    if (cancelledRef.current || inFlightRef.current) return;
    if (!isValidRoomName(room)) return;

    inFlightRef.current = true;
    try {
      await loadExternalApi(domain);
      const parentNode = createOrGetHiddenDiv();
      const ExternalAPI = (window as any).JitsiMeetExternalAPI;

      const api = new ExternalAPI(domain, {
        roomName: room,
        parentNode,
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          prejoinConfig: { enabled: false },
        },
        interfaceConfigOverwrite: { TOOLBAR_BUTTONS: [] },
        userInfo: { displayName: 'Invité' },
      });

      apiRef.current = api;

      const onJoined = () => {
        disposeProbe();
        clearTimer();
        setIsWaiting(false);

        if (authenticated) {
          try { modal.close(); } catch { }
          navigate(`/${room}`);
        } else {
          try { modal.close(); } catch { }
          navigate(`/${room}`, { replace: true, state: { allowGuest: true } });
        }
      };

      const onConnFailed = () => {
        disposeProbe();
        scheduleNext();
      };

      api.addEventListener('videoConferenceJoined', onJoined);
      api.addEventListener('connectionFailed', onConnFailed);

      setTimeout(() => {
        if (!cancelledRef.current) {
          try { api.removeEventListener('videoConferenceJoined', onJoined); } catch { }
          try { api.removeEventListener('connectionFailed', onConnFailed); } catch { }
          disposeProbe();
          scheduleNext();
        }
      }, 4000);
    } catch {
      scheduleNext();
    } finally {
      inFlightRef.current = false;
    }
  };

  // Démarre par un check silencieux, puis (si non lancé) ouvre la modale et lance le probe
  const runFirstCheckThenMaybeWait = async (room?: string) => {
    if (phase !== 'idle') return;

    const rn = (room ?? props.roomName) || '';
    if (!isValidRoomName(rn)) {
      setIsError(true);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    //  reset toute attente/probe en cours
    cancelledRef.current = true;
    clearTimer();
    disposeProbe();
    setIsWaiting(false);
    if (extraDelayTimerRef.current) {
      clearTimeout(extraDelayTimerRef.current);
      extraDelayTimerRef.current = null;
    }

    // nouveau cycle: on réactive
    cancelledRef.current = false;

    //  Premier check silencieux + overlay
    setPhase('first-check');
    const started = await firstCheckRoomStarted(rn);

    if (started) {
      // conf déjà lancée -> route directe (pas de modal)
      setPhase('idle');
      if (authenticated) {
        navigate(`/${rn}`, { replace: true });
      } else {
        navigate(`/${rn}`, { replace: true, state: { allowGuest: true } });
      }
      return;
    }

    // Attendre 4s AVANT d’ouvrir la modale + lancer le probe
    extraDelayTimerRef.current = window.setTimeout(() => {
      if (cancelledRef.current) return;
      setPhase('waiting');
      startWaitingAndProbe(rn);
    }, 4000) as unknown as number;
  };



  const startWaitingAndProbe = (room?: string) => {
    const rn = (room ?? props.roomName) || '';
    if (!isValidRoomName(rn)) {
      setIsError(true);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    currentRoomRef.current = rn;
    cancelledRef.current = false;
    backoffRef.current = POLLING_INTERVAL;
    setIsWaiting(true);
    setTimeout(() => modal.open(), 0);
    clearTimer();
    disposeProbe();
    probeOnce(rn);
  };

  const stopWaitingAndProbe = (byModalClose?: boolean) => {
    cancelledRef.current = true;
    clearTimer();
    disposeProbe();
    setIsWaiting(false);
    setPhase('idle');
    if (extraDelayTimerRef.current) {
      clearTimeout(extraDelayTimerRef.current);
      extraDelayTimerRef.current = null;
    }

    if (!byModalClose) {
      try { originalCloseRef.current?.(); } catch { }
    }
  };
  stopRef.current = stopWaitingAndProbe;

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearTimer();
      disposeProbe();
      if (extraDelayTimerRef.current) {
        clearTimeout(extraDelayTimerRef.current);
        extraDelayTimerRef.current = null;
      }
    };
  }, []);


  // ---------- Navigation state ----------
  useEffect(() => {
    const st = (location.state || {}) as {
      prefillRoomName?: string;
      waitForRoom?: string;
      openAuthModal?: boolean;
    };

    // Préremplir + marquer l’erreur si invalide
    if (st.prefillRoomName) {
      const nm = st.prefillRoomName.trim();
      props.setRoomName(nm);
      setIsError(!validateRoomName(nm));
      setTimeout(() => inputRef.current?.focus(), 0);
      navigate('.', { replace: true, state: {} });
      return;
    }

    //  Arrivée depuis /:roomName valide -> premier check silencieux
    if (st.waitForRoom) {
      const target = st.waitForRoom;
      if (props.roomName !== target) props.setRoomName(target);
      runFirstCheckThenMaybeWait(target);
      navigate('.', { replace: true, state: {} });
      return;
    }

    // ouvrir l’auth + attendre -> on fait d’abord le check
    if (st.openAuthModal && !authenticated) {
      const target = st.waitForRoom ?? props.roomName;
      if (target && target !== props.roomName) props.setRoomName(target);
      runFirstCheckThenMaybeWait(target);
      navigate('.', { replace: true, state: {} });
      return;
    }
  }, [location.state, authenticated, navigate, props.roomName, props.setRoomName]);

  // ---------- Actions UI ----------
  const onCopyLink = () => {
    if (!props.roomName || !isValidRoomName(props.roomName)) return;
    const textToCopy = `${window.location.origin}/${props.roomName}`;
    navigator.clipboard.writeText(textToCopy).then(() => setIsAlertVisible(true));
  };

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidRoomName(props.roomName)) {
      setIsError(true);
      return;
    }
    setIsError(false);

    if (authenticated) {
      stopWaitingAndProbe();
      navigate(`/${props.roomName}`);
      return;
    }

    // invité : premier check, puis éventuel waiting+probe
    runFirstCheckThenMaybeWait();
  }

  const handleGenerateRoomName = () => {
    props.setRoomName(generateRoomName());
  };

  return (
    <div className={styles.homeContainer}>
      {phase === 'first-check' && (
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
      )}

      <modal.Component
        title=""
        buttons={[
          !authenticated && {
            children: "S'authentifier",
            priority: 'primary',
            onClick: () => {
              stopWaitingAndProbe();
              login(validateRoomName(props.roomName) ? props.roomName : undefined);
            },
            doClosesModal: false,
          },
          {
            children: "Annuler l’attente",
            priority: 'secondary',
            onClick: () => stopWaitingAndProbe(),
            doClosesModal: false,
          },
        ].filter(Boolean) as any}
      >
        <div className={styles.contentModal}>
          <h1>La conférence n'a pas encore démarré</h1>
          <p>
            Si vous disposez d'un compte <b>Visio By Apitech</b> vous pouvez vous authentifier,
            sinon merci de patienter. Vous serez connecté automatiquement dès le démarrage.
          </p>

          {/* {!authenticated && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Button
                onClick={() => {
                  stopWaitingAndProbe();
                  login(validateRoomName(props.roomName) ? props.roomName : undefined);
                }}
              >
                S&apos;authentifier
              </Button>
            </div>
          )} */}
        </div>
      </modal.Component>

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
                  value: props.roomName,
                  onChange: e => {
                    const value = e.currentTarget.value;
                    props.setRoomName(value);
                    setIsError(!isValidRoomName(value));
                  },
                  ref: inputRef,
                }}
                stateRelatedMessage={
                  isError && import.meta.env.VITE_CONFERENCE_NAME_REGEX_MESSAGE
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
            <Button onClick={onSubmit} className={styles.joinButton} style={{ width: '100%'}}>
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
