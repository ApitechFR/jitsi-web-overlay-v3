import { generateRoomName } from '../../../utils/roomName';
import { useState, useRef, FormEvent, useEffect } from 'react';
import styles from './HomeJoona.module.css';
// import Input from '@codegouvfr/react-dsfr/Input';
// import Button from '@codegouvfr/react-dsfr/Button';
import { Button } from '@apitechfr/react-dsapitech/Button';
import { Input } from '@apitechfr/react-dsapitech/Input';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useNavigate } from 'react-router-dom';
import { Alert } from '@apitechfr/react-dsapitech/Alert';

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

function HomeJoona(props: HomeJoonaProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isError, setIsError] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  const regexEnv = import.meta.env.VITE_CONFERENCE_NAME_REGEX;
  const regexPattern = regexEnv ?? '^[A-Z0-9]{8}$';
  const regexName = new RegExp(regexPattern);

  useEffect(() => {
    if (isAlertVisible) {
      const timeout = setTimeout(() => {
        setIsAlertVisible(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [isAlertVisible]);

  function isValidRoomName(name: string): boolean {
    return regexName.test(name);
  }
   function onCopyLink() {
    const textToCopy = `${window.location.origin}/${props.roomName}`;

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setIsAlertVisible(true);
      });
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!props.roomName || !isValidRoomName(props.roomName)) {
      setIsError(true);
      return;
    }
    setIsError(false);
    props.setRoomName(props.roomName);
    navigate(`/${props.roomName}`);
  }

  function handleGenerateRoomName() {
    props.setRoomName(generateRoomName());
  }
  return (
    <div className={styles.homeContainer}>
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
                onChange: e => props.setRoomName(e.currentTarget.value),
                ref: inputRef,
              }}
              stateRelatedMessage={
                isError && import.meta.env.VITE_CONFERENCE_NAME_REGEX_MESSAGE
              }
              style={{ width: '100%' }}
            />
            <Button
              className={styles.plusButton}
              onClick={handleGenerateRoomName}
              type="button"
            >
              <ShuffleIcon />
            </Button>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <Button
              // disabled
              onClick={e => onSubmit(e)}
              className={styles.joinButton}
            >
              <span>Rejoindre ou créer</span>
            </Button>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
              {/* <Button
                iconId="fr-icon-settings-5-line fr-btn--icon-right"
                onClick={function noRefCheck(){}}
                priority="tertiary"
              >
                Tester votre matériel
              </Button> */}
              <Button onClick={onCopyLink} priority="tertiary">
                Copier le lien
                <i
                  className="fr-icon-clipboard-line fr-btn--icon-right"
                  aria-hidden="true"
                ></i>
              </Button>
              {isAlertVisible && (
                <div className={styles.alertContainer}>
                  <Alert
                    severity="success"
                    title="Lien copié avec succès !"
                    description=""
                    small
                  />
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