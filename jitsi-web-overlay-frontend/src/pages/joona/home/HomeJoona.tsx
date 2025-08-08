import { generateRoomName } from '../../../utils/roomName';
import { useState, useRef, FormEvent, useEffect, useMemo } from 'react';
import styles from './HomeJoona.module.css';
import { Button } from '@apitechfr/react-dsapitech/Button';
import { Input } from '@apitechfr/react-dsapitech/Input';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useNavigate } from 'react-router-dom';
import { Alert } from '@apitechfr/react-dsapitech/Alert';
import { createModal } from '@apitechfr/react-dsapitech/Modal';

interface HomeJoonaProps {
  readonly roomName: string;
  readonly setRoomName: (roomName: string) => void;
  readonly setIsWhitelisted: (value: boolean | null) => void;
  readonly isWhitelisted: boolean | null;
  readonly email: string;
  readonly setEmail: (email: string) => void;
  readonly sendEmail: (roomName: string) => void;
  readonly joinConference: (roomName: string) => void;
  readonly authenticated: boolean | null;
  readonly conferenceNumber: number;
  readonly participantNumber: number;
}

const POLLING_INTERVAL = 9000; // 9s
const HIDDEN_DIV_ID = 'jitsi-probe-container';

function HomeJoona(props: HomeJoonaProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isError, setIsError] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  // --- Refs/états pour le polling ---
  const apiRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const cancelledRef = useRef(false);
  const backoffRef = useRef(POLLING_INTERVAL);
  const [isWaiting, setIsWaiting] = useState(false);

  const domain = import.meta.env.VITE_JITSI_DOMAIN; 

  const regexEnv = import.meta.env.VITE_CONFERENCE_NAME_REGEX;
  const regexPattern = regexEnv ?? '^[A-Z0-9]{8}$';
  const regexName = new RegExp(regexPattern);

  useEffect(() => {
    if (isAlertVisible) {
      const timeout = setTimeout(() => setIsAlertVisible(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isAlertVisible]);

  //  le modal ne doit pas être recréé à chaque render
  const modal = useMemo(
    () => createModal({ id: 'auth-modal', isOpenedByDefault: false }),
    []
  );

  function isValidRoomName(name: string): boolean {
    return regexName.test(name);
  }

  function onCopyLink() {
    const textToCopy = `${window.location.origin}/${props.roomName}`;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => setIsAlertVisible(true));
    }
  }

  // ---------- Helpers Jitsi External API (polling invité) ----------
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
    try { apiRef.current?.dispose?.(); } catch {}
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
    backoffRef.current = Math.min(backoffRef.current + 3000, 30000); // 9s → 12s → … → 30s
    timerRef.current = window.setTimeout(probeOnce, backoffRef.current) as unknown as number;
  };

  const probeOnce = async () => {
    if (cancelledRef.current || inFlightRef.current) return;
    if (!props.roomName || !isValidRoomName(props.roomName)) return;

    inFlightRef.current = true;
    try {
      await loadExternalApi(domain);
      const parentNode = createOrGetHiddenDiv();
      const ExternalAPI = (window as any).JitsiMeetExternalAPI;

      //  pas de JWT ici : si la room n’est pas encore créée par un user JWT → authfail
      const api = new ExternalAPI(domain, {
        roomName: props.roomName,
        parentNode,
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          prejoinConfig: { enabled: false },
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [],
        },
        userInfo: { displayName: 'Invité' },
      });

      apiRef.current = api;

      const onJoined = () => {
        // La conf existe → on y va
        disposeProbe();
        clearTimer();
        setIsWaiting(false);
        try { modal.close(); } catch {}
        navigate(`/${props.roomName}`);
      };

      const onConnFailed = () => {
        //  pas de JWT ici : si la room n’est pas encore créée par un user JWT → authfail
        disposeProbe();
        scheduleNext();
      };

      api.addEventListener('videoConferenceJoined', onJoined);
      api.addEventListener('connectionFailed', onConnFailed);

      // Sécurité : si aucun event en 6s → retry
      setTimeout(() => {
        if (!cancelledRef.current) {
          try { api.removeEventListener('videoConferenceJoined', onJoined); } catch {}
          try { api.removeEventListener('connectionFailed', onConnFailed); } catch {}
          disposeProbe();
          scheduleNext();
        }
      }, 6000);
    } catch {
      scheduleNext();
    } finally {
      inFlightRef.current = false;
    }
  };

  const startWaitingAndProbe = () => {
    cancelledRef.current = false;
    backoffRef.current = POLLING_INTERVAL;
    setIsWaiting(true);

    // Ouvre le modal au prochain tick pour garantir qu'il est monté
    setTimeout(() => modal.open(), 0);

    clearTimer();
    disposeProbe();
    probeOnce();
  };

  const stopWaitingAndProbe = () => {
    cancelledRef.current = true;
    clearTimer();
    disposeProbe();
    setIsWaiting(false);
    try { modal.close(); } catch {}
  };

  useEffect(() => {
    // cleanup on unmount
    return () => {
      cancelledRef.current = true;
      clearTimer();
      disposeProbe();
    };
  }, []);

  // ---------- Submit ----------
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!props.roomName || !isValidRoomName(props.roomName)) {
      setIsError(true);
      return;
    }
    setIsError(false);

    // User authentifié → on part direct
    if (props.authenticated) {
      stopWaitingAndProbe();
      navigate(`/${props.roomName}`);
      return;
    }

    // Invité → modal + vérification auto jusqu’au démarrage
    startWaitingAndProbe();
  }

  function handleGenerateRoomName() {
    props.setRoomName(generateRoomName());
  }

  return (
    <div className={styles.homeContainer}>
      <modal.Component title="">
        <div className={styles.contentModal}>
          <h1>La conférence n'a pas encore démarré</h1>
          <p>
            Si vous disposez d'un compte <b>Visio By Apitech</b> vous pouvez vous authentifier,
            sinon merci de patienter. Vous serez connecté automatiquement dès le démarrage.
          </p>

          {!props.authenticated && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Button
                onClick={() => {
                  // Ferme le modal, stoppe le polling et redirige vers l’auth si tu as une route dédiée
                  stopWaitingAndProbe();
                
                }}
              >
                S'authentifier
              </Button>
              
            </div>
          )}
        </div>
      </modal.Component>

      <div className={styles.firstContainer}>
        <h1 className={styles.homeTitle}>Rejoindre une visio conférence</h1>
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
            />
            <Button className={styles.plusButton} onClick={handleGenerateRoomName} type="button">
              <ShuffleIcon />
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button onClick={onSubmit} className={styles.joinButton}>
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
