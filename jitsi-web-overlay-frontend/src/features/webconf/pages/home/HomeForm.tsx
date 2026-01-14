import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Badge } from '@codegouvfr/react-dsfr/Badge';
import styles from './Home.module.css';
import AuthModal from './AuthModal';
import { Accordion } from '@codegouvfr/react-dsfr/Accordion';
// import { Alert } from '@codegouvfr/react-dsfr/Alert';
import MuiAlert from '@mui/material/Alert';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import api from '../../../../axios/axios';
import { validateconferenceName } from '../../utils/conferenceName';
import { useNavigate } from 'react-router-dom';
import { fr } from '@codegouvfr/react-dsfr';

interface AuthModalProps {
  roomName: string;
  email: string;
  isWhitelisted: boolean | null;
  setEmail: (mail: string) => void;
  sendEmail: (mail: string) => void;
  setIsWhitelisted: (isWhitelisted: boolean | null) => void;
  setRoomName: (roomName: string) => void;
  joinConference: () => void;
  authenticated: boolean | null;
  setButtons: (a: boolean) => void;
  buttons: boolean;
  conferenceNumber: number;
  participantNumber: number;
}

function HomeForm(props: AuthModalProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState<JSX.Element | string>(<></>);
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
          if (res.data.toLowerCase() === 'internet') {
            if (!props.authenticated) {
              setOpenModal(true);
            }
            if (props.authenticated) {
              props.joinConference();
            }
          } else {
            props.joinConference();
          }
        });
      }
    } else if (roomNameConstraintOk(props.roomName)) {
      api
        .get('/roomExists/' + props.roomName)
        .then(() => {
          return navigate('/' + props.roomName);
        })
        .catch(() => {
          api.get('/authentication/whereami').then(res => {
            if (res.data.toLowerCase() == 'internet') {
              if (!props.authenticated) {
                setOpenModal(true);
              }
              if (props.authenticated) {
                props.joinConference();
              }
            }
            if (res.data.toLowerCase() !== 'internet') {
              props.joinConference();
            }
          });
        });
    }
    setOpenModal(false);
  }

  const verifyAndSetVAlue = React.useCallback(
    (value: string) => {
      if (value) {
        if (validateconferenceName(value)) {
          props.setRoomName(value);
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
          props.setRoomName(value);
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
        props.setRoomName(value);
        setMessage('');
      }
    },
    [props, setMessage]
  );

  const change = (e: string) => {
    verifyAndSetVAlue(e);
  };

  useEffect(() => {
    verifyAndSetVAlue(props.roomName);
  }, [props.roomName, verifyAndSetVAlue]);

  const handleClose = (
    event: Event | React.SyntheticEvent<Element, Event>,
    reason: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const up = '+';
  const down = '--';
  return (
    <div className={styles.HomeForm}>
      <h3>{t('homeForm.title')}</h3>
      <p>{t('homeForm.subtitle')}</p>
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
                {t('homeForm.inputDesc')}
              </span>
            }
            nativeInputProps={{
              id: 'input',
              value: props.roomName,
              placeholder: t('homeForm.inputPlaceholder'),
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                change(e.target.value),
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
          <AuthModal {...props} setOpen={setOpen} openModal={openModal} />
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
        {t('homeForm.stats', { conferenceNumber: props.conferenceNumber, participantNumber: props.participantNumber })}
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
        {t('homeForm.learnMore')}
      </p>
      <div className={fr.cx('fr-accordions-group')}>
        <Accordion label={t('homeForm.accordionPrereq')}>{t('homeForm.accordionContent1')}</Accordion>
        <Accordion label={t('homeForm.accordionStart')}>{t('homeForm.accordionContent2')}</Accordion>
        <Accordion label={t('homeForm.accordionResources')}>{t('homeForm.accordionContent1')}</Accordion>
        <Accordion label={t('homeForm.accordionMooc')}>{t('homeForm.accordionContent2')}</Accordion>
      </div>
      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <AlertMui>{t('homeForm.linkCopied')}</AlertMui>
      </Snackbar>
    </div>
  );
}

const AlertMui = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof MuiAlert>
>(function Alert(props, ref) {
  return (
    <MuiAlert
      onClose={props.onClose}
      severity="success"
      sx={{ width: '100%' }}
      elevation={6}
      ref={ref}
      variant="filled"
      {...props}
    >
      {props.children}
    </MuiAlert>
  );
});

function getCountOfDigits(str: string) {
  return str.replaceAll(/[^0-9]/g, '').length;
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