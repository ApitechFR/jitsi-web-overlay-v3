import React, { useState, useEffect } from 'react';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Badge } from '@codegouvfr/react-dsfr/Badge';
import styles from './Home.module.css';
import AuthModal from './AuthModal';
import { Accordion } from '@codegouvfr/react-dsfr/Accordion';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import MuiAlert from '@mui/material/Alert';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import api from '../../axios/axios';
import { redirect, useNavigate } from 'react-router-dom';
import { fr } from '@codegouvfr/react-dsfr';

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
  setButtons: (a: boolean) => void;
  buttons: boolean;
  conferenceNumber: number;
  participantNumber: number;
}

function HomeForm(props: AuthModalProps) {
  const [message, setMessage] = useState<JSX.Element | string>(<></>);
  const [messageType, setMessageType] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const navigate = useNavigate();

  function handle() {
    function roomNameConstraintOk(roomName: string) {
      const regex = new RegExp(
        '^(?=(?:[a-zA-Z0-9]*[a-zA-Z]))(?=(?:[a-zA-Z0-9]*[0-9]){3})[a-zA-Z0-9]{10,}$'
      );
      return regex.test(roomName);
    }
    if (!props.roomName) {
      const room = generateRoomName();
      props.setRoomName(room);
      if (roomNameConstraintOk(room)) {
        api.get('/authentication/whereami').then(res => {
          if (res.data.toLowerCase() == 'internet') {
            if (!props.authenticated) {
              // modal.open();
              setOpenModal(true);
            }
            if (props.authenticated) {
              props.joinConference(room);
            }
          }
          if (res.data.toLowerCase() !== 'internet') {
            props.joinConference(room);
          }
        });
      }
    } else if (roomNameConstraintOk(props.roomName)) {
      api
        .get('/roomExists/' + props.roomName)
        .then(res => {
          return navigate('/' + props.roomName);
        })
        .catch(err => {
          api.get('/authentication/whereami').then(res => {
            if (res.data.toLowerCase() == 'internet') {
              if (!props.authenticated) {
                setOpenModal(true);
              }
              if (props.authenticated) {
                return props.joinConference(props.roomName);
              }
            }
            if (res.data.toLowerCase() !== 'internet') {
              return props.joinConference(props.roomName);
            }
          });
        });
    }
    setOpenModal(false);
  }

  const change = (e: string) => {
    verifyAndSetVAlue(e);
  };
  const pattern = new RegExp(
    '^(?=(?:[a-zA-Z0-9]*[a-zA-Z]))(?=(?:[a-zA-Z0-9]*[0-9]){3})[a-zA-Z0-9]{10,}$'
  );

  const verifyAndSetVAlue = (value: string) => {
    if (value) {
      if (pattern.test(value)) {
        setMessageType('valid');
        props.setRoomName(value);
        setMessage(
          <div className={styles.message}>
            <Badge className={styles.badge} severity="success">
              Au moins 3 chiffres
            </Badge>
            <Badge className={styles.badge} severity="success">
              Un minimum de 10 caractères
            </Badge>
            <Badge className={styles.badge} severity="success">
              Des chiffres et des lettres sans accents
            </Badge>
            {/* <small className={styles.roomNameConditionValid}>
              
              Au moins 3 chiffres
            </small>
            <small className={styles.roomNameConditionValid}>
              
              Un minimum de 10 caractères
            </small>
            <small className={styles.roomNameConditionValid}>
              
              Des chiffres et des lettres sans accents
            </small> */}
          </div>
        );
      } else {
        setMessageType('error');
        props.setRoomName(value);
        const message = (
          <div className={styles.message}>
            {getCountOfDigits(value) >= 3 ? (
              <Badge className={styles.badge} severity="success">
                Au moins 3 chiffres
              </Badge>
            ) : (
              // <small className={styles.roomNameConditionValid}>
              //
              //   Au moins 3 chiffres
              // </small>
              <Badge className={styles.badge} severity="error">
                Au moins 3 chiffres
              </Badge>
              // <small className={styles.roomNameConditionNotValid}>
              //
              //   Au moins 3 chiffres
              // </small>
            )}
            {getCountCaracters(value) >= 10 ? (
              <Badge className={styles.badge} severity="success">
                Un minimum de 10 caractères
              </Badge>
            ) : (
              // <small className={styles.roomNameConditionValid}>
              //
              //   Un minimum de 10 caractères
              // </small>
              <Badge className={styles.badge} severity="error">
                Un minimum de 10 caractères
              </Badge>
              // <small className={styles.roomNameConditionNotValid}>
              //
              //   Un minimum de 10 caractères
              // </small>
            )}
            {isAlphaNumeric(value) ? (
              <Badge className={styles.badge} severity="success">
                Des chiffres et des lettres sans accents
              </Badge>
            ) : (
              // <small className={styles.roomNameConditionValid}>
              //
              //   Des chiffres et des lettres sans accents
              // </small>
              <Badge className={styles.badge} severity="error">
                Des chiffres et des lettres sans accents
              </Badge>
              // <small className={styles.roomNameConditionNotValid}>
              //
              //   Des chiffres et des lettres sans accents
              // </small>
            )}
          </div>
        );
        setMessage(message);
      }
    } else {
      setMessageType('');
      props.setRoomName(value);
      setMessage('');
    }
  };

  useEffect(() => {
    verifyAndSetVAlue(props.roomName);
  }, [props.roomName]);

  const handleClose = (
    event: Event | React.SyntheticEvent<any, Event>,
    reason: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  const AlertMui = React.forwardRef(function Alert(props, ref) {
    return (
      <MuiAlert
        onClose={event => handleClose(event, 'timeout')}
        severity="success"
        sx={{ width: '100%' }}
        elevation={6}
        ref={ref as any}
        variant="filled"
        {...props}
      >
        Le lien a été copié
      </MuiAlert>
    );
  });

  const up = '+';
  const down = '--';
  return (
    <div className={styles.HomeForm}>
      <h3>La WebConférence de l'État pour tous les agents publics</h3>
      <p>Audio, vidéo, chat, partage d'écran et de documents</p>
      <form
        className={styles.form}
        onSubmit={e => {
          e.preventDefault();
          handle();
        }}
        noValidate
      >
        <div className={styles.confButtons}>
          <Input
            style={{ width: '100%' }}
            hintText=""
            label={
              <span className={styles.hidden} id="input-desc-error">
                Champ de saisi du nom de la conférence
              </span>
            }
            nativeInputProps={{
              id: 'input',
              value: props.roomName,
              placeholder: 'Saisissez un nom de conférence...',
              onChange: (e: any) => change(e.target.value),
            }}
          />

          <Button
            className={styles.plusButton}
            onClick={e => {
              e.preventDefault();
              verifyAndSetVAlue(generateRoomName());
            }}
            type="button"
          >
            <ShuffleIcon />
          </Button>
        </div>
        <div className={styles.confButtons}>
          <AuthModal
            {...props}
            setOpen={setOpen}
            buttons={props.buttons}
            openModal={openModal}
          />
          <Button
            className={styles.plusButton}
            onClick={() => props.setButtons(!props.buttons)}
            nativeButtonProps={{ id: 'plusButton' }}
            type="button"
          >
            {props.buttons ? down : up}
          </Button>
        </div>
      </form>
      <p>{message}</p>
      <Badge severity="info">
        Actuellement, il y a {props.conferenceNumber} conférences et{' '}
        {props.participantNumber} participants.
      </Badge>
      <hr />
      {/* <Alert
        closable={false}
        description="Il est recommandé de ne pas dépasser 40 participants par conférence pour
        optimiser le confort de vos différents échanges."
        severity="info"
        small
        title=""
      /> */}
      <br />
      <p>
        En savoir plus sur la <strong>WebConf</strong> de l'Etat
      </p>
      <div className={fr.cx('fr-accordions-group')}>
        <Accordion label="Pré-requis">Content of the Accordion 1</Accordion>
        <Accordion label="Démarrer avec la WebConf">
          Content of the Accordion 2
        </Accordion>
        <Accordion label="Ressources supplémentaires">
          Content of the Accordion 1
        </Accordion>
        <Accordion label="le MOOC de la WebConf">
          Content of the Accordion 2
        </Accordion>
      </div>
      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <AlertMui />
      </Snackbar>
    </div>
  );
}

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

export default HomeForm;

function generateRoomName() {
  return (
    Math.random().toString(36).slice(2).toUpperCase() +
    Math.floor(Math.random() * 10) +
    Math.floor(Math.random() * 10) +
    Math.floor(Math.random() * 10)
  );
}