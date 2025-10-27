import { generateconferenceName, validateconferenceName } from '../../../../utils/conferenceName';
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
import CircularProgress from '@mui/material/CircularProgress';
import { useRuntimeConfig } from '../../../../config/ConfigProvider';


interface HomeJoonaProps {
  readonly conferenceName: string;
  readonly setconferenceName: (conferenceName: string) => void;
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
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const backoffRef = useRef(POLLING_INTERVAL);
  const [isWaiting, setIsWaiting] = useState(false);
  const currentRoomRef = useRef<string>('');

  const cfg = useRuntimeConfig();



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

  const isValidconferenceName = (name: string) => validateconferenceName(name);

  // retire l’erreur visuelle dès que le nom devient valide
  useEffect(() => {
    if (props.conferenceName && isValidconferenceName(props.conferenceName)) setIsError(false);
  }, [props.conferenceName]);

  // ---------- Helpers ----------
  /**
   * Vérifie l'état d'une salle via le backend.
   * Retourne true si la salle est active, false sinon ou en cas d'erreur.
   */
  const getRoomStateFromBackend = async (room: string, timeoutMs = 2500): Promise<boolean> => {
    const controller = new AbortController();
    const t = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const apiBase = cfg.VITE_API_URL ?? '/api';
      //console.info('API Base URL for room state check:', apiBase);
      const url = `${apiBase}/conferences/${encodeURIComponent(room)}/state`;
      const res = await fetch(url, { signal: controller.signal, credentials: 'include' });
      if (!res.ok) return false;
      const data = await res.json().catch(() => null);
      if (data && typeof data === 'object' && typeof data.active === 'boolean') {
        return data.active;
      }
      return false;
    } catch {
      return false;
    } finally {
      clearTimeout(t);
    }
  };

  /** Premier check silencieux via backend (2.5s) */
  const firstCheckRoomStarted = async (room: string): Promise<boolean> => {
    if (!isValidconferenceName(room)) return false;
    return await getRoomStateFromBackend(room, 2500);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleNext = (room: string) => {
    if (cancelledRef.current) return;
    if (!room || !isValidconferenceName(room)) return;
    backoffRef.current = Math.min(backoffRef.current + 2000, 30000);
    timerRef.current = window.setTimeout(() => pollRoomUntilStarted(room), backoffRef.current) as unknown as number;
  };

  /** Un “tick” de polling via backend */
  const pollRoomUntilStarted = async (room: string) => {
    if (cancelledRef.current) return;
    const isActive = await getRoomStateFromBackend(room, 4000);

    if (isActive) {
      // Conf démarrée
      clearTimer();
      setIsWaiting(false);
      try { modal.close(); } catch { }
      if (authenticated) {
        navigate(`/${room}`);
      } else {
        navigate(`/${room}`, { replace: true, state: { allowGuest: true } });
      }
      return;
    }

    // pas encore démarrée ou backend indispo → replanifie
    scheduleNext(room);
  };

  // Démarre par un check silencieux, puis (si non lancé) ouvre la modale et lance le poll
  const runFirstCheckThenMaybeWait = async (room?: string) => {
    if (phase !== 'idle') return;

    const rn = (room ?? props.conferenceName) || '';
    if (!isValidconferenceName(rn)) {
      setIsError(true);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    // reset
    cancelledRef.current = true;
    clearTimer();
    setIsWaiting(false);
    if (extraDelayTimerRef.current) {
      clearTimeout(extraDelayTimerRef.current);
      extraDelayTimerRef.current = null;
    }
    cancelledRef.current = false;

    // Premier check + overlay
    setPhase('first-check');
    const started = await firstCheckRoomStarted(rn);

    if (started) {
      setPhase('idle');
      if (authenticated) {
        navigate(`/${rn}`, { replace: true });
      } else {
        navigate(`/${rn}`, { replace: true, state: { allowGuest: true } });
      }
      return;
    }

    // Afficher la modale et lancer le polling immédiatement si la conf n'est pas démarrée
    setPhase('waiting');
    startWaitingAndPoll(rn);
  };

  const startWaitingAndPoll = (room?: string) => {
    const rn = (room ?? props.conferenceName) || '';
    if (!isValidconferenceName(rn)) {
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
    pollRoomUntilStarted(rn);
  };

  const stopWaitingAndPoll = (byModalClose?: boolean) => {
    cancelledRef.current = true;
    clearTimer();
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
  stopRef.current = stopWaitingAndPoll;

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearTimer();
      if (extraDelayTimerRef.current) {
        clearTimeout(extraDelayTimerRef.current);
        extraDelayTimerRef.current = null;
      }
    };
  }, []);

  // ---------- Navigation state ----------
  useEffect(() => {
    const st = (location.state || {}) as {
      prefillconferenceName?: string;
      waitForRoom?: string;
      openAuthModal?: boolean;
    };

    if (st.prefillconferenceName) {
      const nm = st.prefillconferenceName.trim();
      props.setconferenceName(nm);
      setIsError(!validateconferenceName(nm));
      setTimeout(() => inputRef.current?.focus(), 0);
      navigate('.', { replace: true, state: {} });
      return;
    }

    if (st.waitForRoom) {
      const target = st.waitForRoom;
      if (props.conferenceName !== target) props.setconferenceName(target);
      runFirstCheckThenMaybeWait(target);
      navigate('.', { replace: true, state: {} });
      return;
    }

    if (st.openAuthModal && !authenticated) {
      const target = st.waitForRoom ?? props.conferenceName;
      if (target && target !== props.conferenceName) props.setconferenceName(target);
      runFirstCheckThenMaybeWait(target);
      navigate('.', { replace: true, state: {} });
      return;
    }
  }, [location.state, authenticated, navigate, props.conferenceName, props.setconferenceName]);

  // ---------- Actions UI ----------
  const onCopyLink = () => {
    if (!props.conferenceName || !isValidconferenceName(props.conferenceName)) return;
    const textToCopy = `${window.location.origin}/${props.conferenceName}`;
    navigator.clipboard.writeText(textToCopy).then(() => setIsAlertVisible(true));
  };

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidconferenceName(props.conferenceName)) {
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
    runFirstCheckThenMaybeWait();
  }

  const handleGenerateconferenceName = () => {
    props.setconferenceName(generateconferenceName());
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

      <modal.Component
        title=""
        concealingBackdrop={false}
        buttons={[
          !authenticated && {
            children: "S'authentifier",
            priority: 'primary',
            onClick: () => {
              stopWaitingAndPoll();
              login(validateconferenceName(props.conferenceName) ? props.conferenceName : undefined);
            },
            doClosesModal: false,
          },
          {
            children: "Annuler l’attente",
            priority: 'secondary',
            onClick: () => stopWaitingAndPoll(),
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
                  login(validateconferenceName(props.conferenceName) ? props.conferenceName : undefined);
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
                  value: props.conferenceName,
                  onChange: e => {
                    const value = e.currentTarget.value;
                    props.setconferenceName(value);
                    setIsError(!isValidconferenceName(value));
                  },
                  ref: inputRef,
                }}
                stateRelatedMessage={
                  isError && cfg.VITE_CONFERENCE_NAME_REGEX_MESSAGE
                }
                style={{ width: '100%' }}
                addon={
                  <Button className={styles.plusButton} onClick={handleGenerateconferenceName} type="button">
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
