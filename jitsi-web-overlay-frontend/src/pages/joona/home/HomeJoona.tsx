import { useRef, FormEvent } from 'react';
import { generateRoomName } from '../../../utils/roomName';
import styles from './HomeJoona.module.css';
import Input from '@codegouvfr/react-dsfr/Input';
import Button from '@codegouvfr/react-dsfr/Button';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useNavigate } from 'react-router-dom';

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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!props.roomName) {
      return;
    }
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
        <div style={{ width: '70%', margin: 'auto' }}>
          <div style={{ display: 'flex', width: '100%' }}>
            <Input
              label=""
              id="conferenceName"
              nativeInputProps={{
                placeholder: 'Saisissez votre nom de conférence',
                value: props.roomName,
                onChange: e => props.setRoomName(e.currentTarget.value),
                ref: inputRef,
              }}
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
              <Button priority="tertiary">
                Copier le lien{' '}
                <i
                  className="fr-icon-clipboard-line fr-btn--icon-right"
                  aria-hidden="true"
                ></i>
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
