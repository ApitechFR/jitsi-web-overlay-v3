import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Badge } from '@codegouvfr/react-dsfr/Badge';
import CalendarModalComponent from './CalendarModal';

import { useState, useEffect } from 'react';

import styles from './AuthModal.module.css';

const modal = createModal({
  id: 'AgentConnect',
  isOpenedByDefault: false,
});

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
  setOpen: (e: boolean) => void;
  buttons: boolean;
  openModal: boolean;
}

function roomNameConstraintOk(roomName: string) {
  /**
   * Verify if the room name is valid
   * @param {String} roomName The room name
   * @return {Boolean}        True if the room name is valid, false otherwise
   */
  const regex = new RegExp(
    '^(?=(?:[a-zA-Z0-9]*[a-zA-Z]))(?=(?:[a-zA-Z0-9]*[0-9]){3})[a-zA-Z0-9]{10,}$'
  );
  return regex.test(roomName);
}

export default function AuthModal(props: AuthModalProps) {
  const [msg, setMsg] = useState<string | null>('');
  const [buttonMsg, setButtonMsg] = useState(
    'Recevoir le code de vérification par email'
  );
  const [isCheked, setIsChecked] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href + props.roomName);
    props.setOpen(true);
  };

  useEffect(() => {
    props.openModal ? modal.open() : null;
  }, [props.openModal]);

  useEffect(() => {
    props.setIsWhitelisted(null);
    const mail = localStorage.getItem('email');
    const checked1 = localStorage.getItem('checked');
    const checked = checked1 === 'true';
    if (checked) {
      if (mail) {
        props.setEmail(mail);
      }
    } else {
      props.setEmail('');
      localStorage.setItem('email', '');
    }
    setIsChecked(checked);
    setMsg(null);
    setButtonMsg('Recevoir le code de vérification par email');
  }, []);

  const agentConnect = (room: string) => {
    fetch(
      `${
        import.meta.env.VITE_BASE_URL
      }/authentication/login_authorize?room=${room}`,
      {
        redirect: 'manual',
      }
    ).then(res => {
      if (res.type === 'opaqueredirect') {
        window.location.href = res.url;
      } else {
        // handle normally / pass on to next handler
        window.location.href = res.url;
      }
    });
  };
  const onCheck = () => {
    setIsChecked(!isCheked);
    localStorage.setItem('checked', (!isCheked).toString());
  };

  const mailchanger = (e: any) => {
    props.setEmail(e.target.value);
    localStorage.setItem('email', e.target.value);
  };

  const mailSender = (e: any) => {
    props.sendEmail(e);
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
        <button type="button">
          <span className={styles.hidden} id="input-desc-error">
            text
          </span>
          <img
            alt="agentConnect"
            src="/static/media/ac-btn-bleu.svg"
            onClick={() => agentConnect(props.roomName)}
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
            value: props.email,
            onChange: e => mailchanger(e),
            required: true,
          }}
        />
        <Checkbox
          options={[
            {
              label: 'se rappeler de mon adresse email',
              nativeInputProps: {
                checked: isCheked,
                name: 'checkboxes-1',
                value: 'value1',
                onChange: () => onCheck(),
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
          disabled={!roomNameConstraintOk(props.roomName)}
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

function generateRoomName() {
  return (
    Math.random().toString(36).slice(2).toUpperCase() +
    Math.floor(Math.random() * 10) +
    Math.floor(Math.random() * 10) +
    Math.floor(Math.random() * 10)
  );
}
