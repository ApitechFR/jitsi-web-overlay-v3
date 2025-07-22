import { useState, useRef, FormEvent, useEffect } from 'react';
import styles from './HomeJoona.module.css';
import Input from '@codegouvfr/react-dsfr/Input';
import Button from '@codegouvfr/react-dsfr/Button';
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useNavigate } from 'react-router-dom';
import RandExp from 'randexp';

interface AuthModalProps {
  roomName: string;
  email: string;
  isWhitelisted: boolean | null;
  setEmail: (mail: string) => void;
  sendEmail: (mail: string) => void;
  setIsWhitelisted: (e: any) => void;
  setRoomName: (e: any) => void;
  joinConference: (e: any) => void;
  authenticated: boolean | null;
  conferenceNumber: number;
  participantNumber: number;
}

function HomeJoona(props: AuthModalProps) {
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!props.roomName || !isValidRoomName(props.roomName)) {
      setIsError(true)
      return
    };
    setIsError(false);
    props.setRoomName(props.roomName);
    navigate(`/${props.roomName}`);
  }

  function generateRoomName() {
    const name = new RandExp(regexName).gen();
    return name;
  }

  function onCopyLink() {
    const textToCopy = `${window.location.origin}/${props.roomName}`;

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setIsAlertVisible(true);
      });
    }
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
                onChange: (e) => {
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
            <Button
              className={styles.plusButton}
              onClick={() => {
                const newName = generateRoomName();
                props.setRoomName(newName);
                setIsError(!isValidRoomName(newName));
              }}
              type="button"
            >
              <ShuffleIcon />
            </Button>
          </div>
          <div className={styles.buttonsPart}>
            <Button
              disabled={!isValidRoomName(props.roomName)}
              onClick={(e) => onSubmit(e)}
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
              <Button
                onClick={onCopyLink}
                priority="tertiary"
              >
                Copier le lien
                <i className="fr-icon-clipboard-line fr-btn--icon-right" aria-hidden="true"></i>
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
        <img src="src/assets/illustration_homepage_visio_by_apitech.svg" alt="Image page d’accueil" />
      </div>
    </div>
  );
}

export default HomeJoona;
