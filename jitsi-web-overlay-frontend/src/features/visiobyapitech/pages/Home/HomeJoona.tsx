
import { generateConferenceName, validateConferenceName } from '../../../../utils/conferenceName';
// import { validateconferenceName } from '../../utils/conferenceName';
import React, { useState, useRef, FormEvent, useEffect, useMemo } from 'react';
import styles from './HomeJoona.module.css';
import { Button } from '@apitechfr/react-dsapitech/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@apitechfr/react-dsapitech/Badge';
import { Tooltip } from "@apitechfr/react-dsapitech/Tooltip";
import { createModal } from '@apitechfr/react-dsapitech/Modal';
import { useIsModalOpen } from '@apitechfr/react-dsapitech/Modal/useIsModalOpen';
import { useAuth } from '../../../../auth/useAuth';
import { useRuntimeConfig } from '../../../../config/ConfigProvider';
import { useConferencePolling } from '../../hooks/useConferencePolling';
import { ConferenceWaitingModal } from './ConferenceWaitingModal';
import VisioMode from '../../components/Homepage/VisioMode';
import WebinaireMode from '../../components/Homepage/WebinaireMode';
import { useTranslation } from 'react-i18next';

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

type Mode = "visio" | "webinaire";

const POLLING_INTERVAL = 2000; // 2s

function HomeJoona(props: HomeJoonaProps) {
  const cfg = useRuntimeConfig();
  const AppTemplate = (cfg.VITE_APP_TEMPLATE as string) || 'joona';
  const isWebinarEnabled = cfg.VITE_IS_WEBINAR_ENABLED === true || cfg.VITE_IS_WEBINAR_ENABLED === 'true';
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isError, setIsError] = useState(true);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("visio");

  const [message, setMessage] = useState<JSX.Element | string>(<></>);

  // Timer pour le délai supplémentaire de 2s avant d’ouvrir le modal
  const extraDelayTimerRef = useRef<number | null>(null);

  const isValidConferenceName = (name: string) => validateConferenceName(name);

  const { authenticated, login } = useAuth();
  const { t } = useTranslation();

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
  const isConferenceNameInvalid = (value: string) =>
    value.trim() !== "" && !isValidConferenceName(value);

  const hasValue = props.conferenceName.trim() !== "";
  const isInvalid = isConferenceNameInvalid(props.conferenceName);

  const isErrorConfName = !hasValue || isInvalid;
  const showError = isInvalid;

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
    }

    if (st.waitForRoom) {
      const target = st.waitForRoom;
      if (props.conferenceName !== target) props.setConferenceName(target);
      runFirstCheckThenMaybeWait(target);
      navigate('.', { replace: true, state: {} });
    }

    if (st.openAuthModal && !authenticated) {
      const target = st.waitForRoom ?? props.conferenceName;
      if (target && target !== props.conferenceName) props.setConferenceName(target);
      runFirstCheckThenMaybeWait(target);
      navigate('.', { replace: true, state: {} });
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
    }
    setIsError(false);

    if (authenticated) {
      stopWaitingAndPoll();
      navigate(`/${props.conferenceName}`);
    }

    // invité : premier check via backend, puis éventuel waiting + poll
    runFirstCheckThenMaybeWait(props.conferenceName);
  }

  const handleGenerateRoomName = () => {
    props.setConferenceName(generateConferenceName());
  };

  const switchMode = () => {
    if (!isWebinarEnabled && mode === 'visio') return; // n'autorise pas le passage en mode webinaire si désactivé
    setMode(mode === "visio" ? "webinaire" : "visio")
  }

  /*********** Fonction verif regex Webconf *************/

  const verifyAndSetVAlue = React.useCallback(
    (value: string) => {
      if (value) {
        if (isValidConferenceName(value)) {
          props.setConferenceName(value);
          setMessage(
            <div className={styles.message}>
              <Badge className={styles.badge} severity="success">
                {t('homeForm.atLeast3Digits')}
              </Badge>
              <Badge className={styles.badge} severity="success">
                {t('homeForm.min10Chars')}
              </Badge>
              <Badge className={styles.badge} severity="success">
                {t('homeForm.digitsAndLetters')}
              </Badge>
            </div>
          );
        } else {
          props.setConferenceName(value);
          const message = (
            <div className={styles.message}>
              {getCountOfDigits(value) >= 3 ? (
                <Badge className={styles.badge} severity="success">
                  {t('homeForm.atLeast3Digits')}
                </Badge>
              ) : (
                <Badge className={styles.badge} severity="error">
                  {t('homeForm.atLeast3Digits')}
                </Badge>
              )}
              {getCountCaracters(value) >= 10 ? (
                <Badge className={styles.badge} severity="success">
                  {t('homeForm.min10Chars')}
                </Badge>
              ) : (
                <Badge className={styles.badge} severity="error">
                  {t('homeForm.min10Chars')}
                </Badge>
              )}
              {isAlphaNumeric(value) ? (
                <Badge className={styles.badge} severity="success">
                  {t('homeForm.digitsAndLetters')}
                </Badge>
              ) : (
                <Badge className={styles.badge} severity="error">
                  {t('homeForm.digitsAndLetters')}
                </Badge>
              )}
            </div>
          );
          setMessage(message);
        }
      } else {
        props.setConferenceName(value);
        setMessage('');
      }
    },
    [props, setMessage, t]
  );

  const change = (e: string) => {
    verifyAndSetVAlue(e);
  };

  useEffect(() => {
    verifyAndSetVAlue(props.conferenceName);
  }, [props.conferenceName, verifyAndSetVAlue]);

  // function webconf pour random confName ? 
  const onclickGenerateRoomName = () => {
    verifyAndSetVAlue(props.conferenceName);
  };

  /********************************************************/

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

        {mode === 'visio' && (
          <VisioMode
            isError={isErrorConfName}
            showError={showError}
            isAlertVisible={isAlertVisible}
            conferenceName={props.conferenceName}
            setConferenceName={props.setConferenceName}
            onclickGenerateRoomName={onclickGenerateRoomName}
            handleGenerateRoomName={handleGenerateRoomName}
            onSubmit={onSubmit}
            onCopyLink={onCopyLink}
            AppTemplate={AppTemplate}
            inputRef={inputRef}
          />
        )}
        {isWebinarEnabled && mode === 'webinaire' && (
          <WebinaireMode
            isError={isErrorConfName}
            showError={showError}
            conferenceName={props.conferenceName}
            setConferenceName={props.setConferenceName}
            onclickGenerateRoomName={onclickGenerateRoomName}
            handleGenerateRoomName={handleGenerateRoomName}
            onSubmit={onSubmit}
            isValidConferenceName={isValidConferenceName}
            AppTemplate={AppTemplate}
            inputRef={inputRef}
          />
        )}

        {isWebinarEnabled && (
          <div className={styles.switchModeBlock}>
            <Button className={`${styles.joinButton} ${styles.buttonSwitchMode}`} onClick={switchMode} priority="tertiary">
              <span>{mode === "visio" ? t('homeModes.webinair_mode') : t('homeModes.visio_mode')}</span>
              <i className="ri-live-line"></i>
            </Button>
            <Tooltip
              kind="hover"
              title={t('homeModes.tooltip')}
            >
              <i className="ri-question-line"></i>
            </Tooltip>
          </div>
        )}
      </div>

      <div className={styles.secondContainer}>
        <img
          src="/assets/illustration_homepage_visio_by_apitech.svg"
          alt="Page d’accueil"
        />
      </div>
    </div>
  );
}
export default HomeJoona;

/********* function webconf *********/

function getCountOfDigits(str: string) {
  return str.replace(/[^0-9]/g, '').length;
}

function getCountCaracters(str: string) {
  return str.length;
}

function isAlphaNumeric(str: string) {
  const isAlphaNum = new RegExp('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$');
  return isAlphaNum.test(str);
}
