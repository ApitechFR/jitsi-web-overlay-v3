import { useState, MouseEventHandler, MouseEvent, useRef, useEffect, FormEvent } from 'react';
import styles from './HomeJoona.module.css';
// import Input from '@codegouvfr/react-dsfr/Input';
// import Button from '@codegouvfr/react-dsfr/Button';
import { Button } from "@apitechfr/react-dsapitech/Button";
import { Input } from "@apitechfr/react-dsapitech/Input"
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useNavigate } from 'react-router-dom';

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
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (props.roomName) {
      setIsError(false)
    }
  }, [props.roomName])


  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!props.roomName) {
      setIsError(true)
      return
    };
    props.setRoomName(props.roomName);
    navigate(`/${props.roomName}`);
  }

  function generateRoomName() {
    return props.setRoomName(
      Math.random().toString(36).slice(2).toUpperCase() +
      Math.floor(Math.random() * 10) +
      Math.floor(Math.random() * 10) +
      Math.floor(Math.random() * 10)
    );
  }
  return (
    <div className={styles.homeContainer}>
      <div className={styles.firstContainer}>
        <h1 className={styles.homeTitle}>Rejoindre une visio conférence</h1>
        <div style={{ width: '70%', margin: 'auto' }}>
          <div style={{ display: 'flex', width: '100%' }}>
            <Input
              label=""
              id="conferenceName"
              nativeInputProps={{
                placeholder: 'Saisissez votre nom de conférence',
                value: props.roomName,
                onChange: (e) => props.setRoomName(e.currentTarget.value),
                ref: inputRef,
              }}
              style={{ width: '100%' }}
            />
            <Button
              className={styles.plusButton}
              onClick={generateRoomName}
              // onClick={e => {
              //   e.preventDefault();
              //   verifyAndSetVAlue(generateRoomName());
              // }}
              type="button"
            >
              <ShuffleIcon />
            </Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              // disabled
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
                onClick={function noRefCheck() { }}
                priority="tertiary"
              >
                Copier le lien
                <i className="fr-icon-clipboard-line fr-btn--icon-right" aria-hidden="true"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.secondContainer}>
        <img src="" alt="test" />
      </div>
    </div>
  );
}

export default HomeJoona;
