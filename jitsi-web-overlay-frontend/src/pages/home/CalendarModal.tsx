import React from 'react';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { Button } from '@codegouvfr/react-dsfr/Button';
import ICalLink from 'react-icalendar-link';
import { Input } from '@codegouvfr/react-dsfr/Input';
import axios from 'axios';
import styles from './Home.module.css';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

import { useState, useEffect } from 'react';

const ICalendarLink = ICalLink as any;

function generateRoomName() {
  return (
    Math.random().toString(36).slice(2).toUpperCase() +
    Math.floor(Math.random() * 10) +
    Math.floor(Math.random() * 10) +
    Math.floor(Math.random() * 10)
  );
}

const modal = createModal({
  id: 'Calendar1',
  isOpenedByDefault: false,
});

export default function CalendarModalComponent(props: any) {
  let roomName = props.roomName;
  const date = new Date(new Date().setHours(new Date().getHours() + 2))
    .toISOString()
    .substring(0, 16);

  const isOpen = useIsModalOpen(modal);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [copied, setCopied] = useState('Copier les Informations');
  const [disabled, setDisabled] = useState(false);
  const [dateTimeStart, setDateTimeStart] = useState(date);
  const [duration, setDuration] = useState('00:00');
  const dateTimeEnd = new Date(
    new Date(dateTimeStart).setHours(
      new Date(dateTimeStart).getHours() + 2 + parseInt(duration.split(':')[0]),
      new Date(dateTimeStart).getMinutes() + parseInt(duration.split(':')[1])
    )
  )
    .toISOString()
    .substring(0, 16);

  const [open, setOpen] = useState(false);

  const handleClose = (
    event: Event | React.SyntheticEvent<any, Event>,
    reason: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  const copy = () => {
    const par = `Lien vers la conférence: ${roomName} Numéro de téléphone: ${phoneNumber} PIN: ${pin}`;
    navigator.clipboard.writeText(par);
    setCopied('text copié');
    setDisabled(true);
  };

  const handle = async () => {
    modal.open();
    if (!roomName) {
      roomName = generateRoomName();
      await props.setRoomName(roomName);
      await setCopied('Copier les Informations');
      await setDisabled(false);
    } else {
      await props.setRoomName(roomName);
      await setCopied('Copier les Informations');
      await setDisabled(false);
    }
  };

  const pattern = new RegExp(
    '^(?=(?:[a-zA-Z0-9]*[a-zA-Z]))(?=(?:[a-zA-Z0-9]*[0-9]){3})[a-zA-Z0-9]{10,}$'
  );

  useEffect(() => {
    if (pattern.test(roomName) && isOpen) {
      axios
        .get(
          `${
            import.meta.env.VITE_VOXAPI_URL
          }/api/v1/conn/jitsi/conference/code?conference=${roomName}@conference.${
            import.meta.env.VITE_JITSI_DOMAIN
          }&url=https://${import.meta.env.VITE_JITSI_DOMAIN}/${roomName}`
        )
        .then(res => {
          setPin(res.data.id);
        });
    }
  }, [roomName, isOpen]);

  useEffect(() => {
    if (pattern.test(roomName) && isOpen) {
      axios
        .get(
          `${
            import.meta.env.VITE_VOXAPI_URL
          }/api/v1/conn/jitsi/phoneNumbers?conference=${roomName}@conference.${
            import.meta.env.VITE_JITSI_DOMAIN
          }`
        )
        .then(res => {
          setPhoneNumber(res.data.numbers.FR[0]);
        });
    }
  }, [roomName, isOpen]);

  const copyEvent = () => {
    const transformDate = (date: any) => {
      const date1 = date.split('T')[0].split('-').reverse().join('/');
      const time = date.split('T')[1];
      return date1 + ' ' + time;
    };
    const par = `
    Lien vers la conférence: ${window.location}${roomName}
    date de début: ${
      dateTimeStart &&
      transformDate((dateTimeStart || '').toString().substring(0, 16))
    } 
    date de fin: ${
      dateTimeEnd &&
      transformDate((dateTimeEnd || '').toString().substring(0, 16))
    } 
    Coordonnées téléphoniques de la conférence :
         - Numéro de téléphone: ${phoneNumber} 
         - PIN: ${pin}
    `;
    navigator.clipboard.writeText(par);
    setOpen(true);
  };

  const Alert = React.forwardRef(function Alert(props, ref) {
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
        Les informations ont été copiées
      </MuiAlert>
    );
  });

  const event = {
    title: `Webconférence de l'État : ${roomName}`,
    description: `Lien vers la conférence: ${window.location}${roomName} Numéro de téléphone: ${phoneNumber} PIN: ${pin}`,
    startTime: dateTimeStart && dateTimeStart,
    endTime: dateTimeEnd && dateTimeEnd,
    location: `${window.location}${roomName}`,
    // attendees: [
    //   "Hello World <hello@world.com>",
    //   "Hey <hey@test.com>",
    // ]
  };

  return (
    <div id="">
      <modal.Component
        title={
          <span className={styles.hidden} id="h1">
            Heading
          </span>
        }
      >
        <br />
        <h6>Générer une invitation: {roomName}</h6>
        <p>
          <Input
            label={<small id="input1-desc-error">Date de début :</small>}
            nativeInputProps={{
              id: 'input1',
              type: 'datetime-local',
              value: dateTimeStart,
              onChange: e => setDateTimeStart(e.target.value),
            }}
          />
        </p>
        <p>
          <Input
            label={
              <span id="input2-desc-error">
                Durée{' '}
                {`(${duration.split(':')[0]}h ${duration.split(':')[1]}min)`} :
              </span>
            }
            nativeInputProps={{
              id: 'input2',
              type: 'time',
              value: duration,
              onChange: e => setDuration(e.target.value),
            }}
          />
        </p>
        <h6>Coordonnées téléphoniques de la conférence :</h6>
        <p>- Téléphone: {phoneNumber}</p>
        <p>- Code de la conférence: {`${pin}#`}</p>
        <Snackbar
          open={open}
          autoHideDuration={6000}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Alert />
        </Snackbar>

        <div className={styles.calendarModalButtons}>
          <ICalendarLink
            event={event}
            className={styles.modalButton}
            filename={`WebConf de l'Etat - Conférence ${roomName}`}
          >
            <Button
              // variant="contained"
              style={{ backgroundColor: '#0a76f6', textTransform: 'none' }}
              type="button"
            >
              Ajouter au calendrier
            </Button>
          </ICalendarLink>
          <Button
            style={{ backgroundColor: '#0a76f6', textTransform: 'none' }}
            className={styles.modalButton}
            title="copy"
            onClick={() => copyEvent()}
            disabled={disabled}
            type="button"
            // nativeButtonProps={{ id: 'copyCalendarButton' }}
          >
            Copier
          </Button>
        </div>
      </modal.Component>
      <Button
        onClick={handle}
        className={styles.button}
        priority="primary"
        type="button"
        nativeButtonProps={{ id: 'calendarButton' }}
      >
        Planifier une conférence
      </Button>
    </div>
  );
}
