import { validateconferenceName } from '../../utils/conferenceName';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Badge } from '@codegouvfr/react-dsfr/Badge';
import CalendarModalComponent from './CalendarModal';

import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';

import styles from './AuthModal.module.css';

const modal = createModal({
  id: 'AgentConnect',
  isOpenedByDefault: false,
});

interface AuthModalProps {
  readonly roomName: string;
  readonly email: string;
  readonly isWhitelisted: boolean | null;
  readonly setEmail: (mail: string) => void;
  readonly sendEmail: (mail: string) => void;
  readonly setIsWhitelisted: (whitelisted: boolean | null) => void;
  readonly setRoomName: (roomName: string) => void;
  readonly joinConference: () => void;
  readonly authenticated: boolean | null;
  readonly setOpen: (open: boolean) => void;
  readonly buttons: boolean;
  readonly openModal: boolean;
}

export default function AuthModal(props: AuthModalProps) {
  const { email, setEmail, login } = useAuth();
  const [msg, setMsg] = useState<string | null>('');
  const [buttonMsg, setButtonMsg] = useState(
    'Recevoir le code de vérification par email'
  );
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href + props.roomName);
    props.setOpen(true);
  };

  useEffect(() => {
    if (props.openModal) modal.open();
  }, [props.openModal]);

  useEffect(() => {
    props.setIsWhitelisted(null);

    setEmail('');
    setIsChecked(false);
    setMsg(null);
    setButtonMsg('Recevoir le code de vérification par email');
  }, [setEmail, props.setIsWhitelisted]);

  const agentConnect = (room: string) => {
    login(room);
  };

  const onCheck = () => {
    setIsChecked(!isChecked);
  };

  const mailchanger = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const mailSender = (roomName: string) => {
    props.sendEmail(roomName);
    setButtonMsg('Email non reçu ? Cliquez ici pour recevoir un nouvel email');
  };
  return (
    <>
      <modal.Component title="Vous êtes l’organisateur de la réunion ?">
        <p>
          <small>
            Nous avons besoin de vérifier votre identité afin de créer la
            conférence {props.roomName}.
          </small>
        </p>
        <button
          type="button"
          className={styles.agentConnectBtn}
          onClick={() => agentConnect(props.roomName)}
          aria-label="Connexion AgentConnect"
        >
          <span className={styles.hidden} id="input-desc-error">
            text
          </span>
          <img
            alt="AgentConnect"
            src="/static/media/ac-btn-bleu.svg"
            style={{ pointerEvents: 'none' }}
          />
        </button>
        <p>
          <small>
            <a href="https://agentconnect.gouv.fr/">
              Qu'est ce que Agent Connect ?
            </a>
          </small>
        </p>
        <Input
          label={
            <span id="input3-desc-error">
              Ou saissez votre adresse email professionnelle:
            </span>
          }
          nativeInputProps={{
            'aria-describedby': 'input3-desc-error',
            'aria-labelledby': 'input3-desc-error',
            id: 'input3',
            value: email,
            onChange: mailchanger,
            required: true,
          }}
        />
        <Checkbox
          options={[
            {
              label: 'se rappeler de mon adresse email',
              nativeInputProps: {
                checked: isChecked,
                name: 'checkboxes-1',
                value: 'value1',
                onChange: onCheck,
              },
            },
          ]}
        />
        <Button
          className={styles.modalButtons}
          onClick={() => mailSender(props.roomName)}
          type="button"
        >
          <span className={styles.hidden} id="input-desc-error">
            text
          </span>
          {buttonMsg}
        </Button>
        {msg}
        {props.isWhitelisted === false ? (
          <p>
            <Badge severity="error">
              votre adresse email n'est pas valide. Merci de saisir votre
              adresse email professionelle.
            </Badge>
          </p>
        ) : null}
        {props.isWhitelisted === true ? (
          <p>
            <Badge severity="success">Message envoyé.</Badge>
          </p>
        ) : null}
      </modal.Component>
      <div className={styles.buttons}>
        <Button
          // onClick={handle}
          type="submit"
          className={styles.button}
          disabled={!validateconferenceName(props.roomName)}
        >
          Rejoindre ou créer
        </Button>
        <br />
        {props.buttons ? (
          <div id="Calendar">
            <CalendarModalComponent {...props} />
            <Button
              className={styles.button}
              nativeButtonProps={{ id: 'copyButton' }}
              onClick={copyLink}
              type="button"
            >
              Copier le lien
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
}
