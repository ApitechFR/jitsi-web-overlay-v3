import { useState, FormEvent, useEffect } from 'react';

import { Badge, Button, Alert, Input } from '@ds';

import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useRuntimeConfig } from '@/config/ConfigProvider';

import { createModal } from '@ds';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import ICalLink from 'react-icalendar-link';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';

import styles from "../../pages/Home/HomeJoona.module.css"
import { useTranslation } from 'react-i18next';
import { validateConferenceName } from '@/utils/conferenceName';
import { buildCalendarEvent, buildClipboardText, formatForInput } from '@/utils/CalendarModal';
import { VoxifyService } from '@/api/services/jitsi/voxify.service';

interface VisioModeProps {
  readonly isError: boolean;
  readonly isAlertVisible: boolean;
  readonly conferenceName: string;
  readonly conferenceNumber: number;
  readonly participantNumber: number;
  readonly setConferenceName: (conferenceName: string) => void;
  readonly handleGenerateRoomName: () => void;
  readonly onSubmit: (e: FormEvent) => void;
  readonly onCopyLink: () => void;
  readonly AppTemplate: string;
  readonly inputRef: React.RefObject<HTMLInputElement>;
}

const ICalendarLink = ICalLink as any;

const calendarModal = createModal({
  id: 'Calendar1',
  isOpenedByDefault: false,
});

function VisioMode(props: VisioModeProps) {

  const cfg = useRuntimeConfig();

  //----------------------------- CALENDAR MODAL ---------------------------//
  const voxApiUrl = cfg.VITE_VOXAPI_URL;
  console.log('VOX API URL:', voxApiUrl);
  const roomName = props.conferenceName;
  const date = new Date()
  date.setHours(date.getHours() + 2);

  const isOpen = useIsModalOpen(calendarModal);
  const [dateTimeStart, setDateTimeStart] = useState(formatForInput(date));
  const [duration, setDuration] = useState('00:00');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [open, setOpen] = useState(false);

  const [hours, minutes] = duration.split(':').map(Number);

  const startDate = new Date(dateTimeStart);

  const dateTimeEnd = new Date(
    startDate.getTime() + (hours * 60 + minutes) * 60000
  );

  const formattedEnd = formatForInput(dateTimeEnd);

  const handleClose = (
    event: Event | React.SyntheticEvent<any, Event>,
    reason: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  const copyEvent = () => {
    const text = buildClipboardText({
      meetingUrl: `${window.location}${roomName}`,
      dateTimeStart,
      formattedEnd,
      phoneNumber,
      pin,
      voxApiUrl
    });

    navigator.clipboard.writeText(text);
    setOpen(true);
  };


  useEffect(() => {
    if (isOpen && voxApiUrl && cfg.VITE_JITSI_DOMAIN && roomName) {
      VoxifyService.getConferenceCode(roomName)
        .then(setPin)
        .catch(console.error);
    }
  }, [roomName, isOpen]);

  useEffect(() => {
    if (isOpen && voxApiUrl && cfg.VITE_JITSI_DOMAIN && roomName) {
      VoxifyService.getPhoneNumbers(roomName)
        .then(setPhoneNumber)
        .catch(console.error);
    }
  }, [roomName, isOpen]);

  const meetingUrl = `${window.location}${roomName}`;

  const event = buildCalendarEvent({
    appTemplate: props.AppTemplate,
    roomName,
    meetingUrl,
    dateTimeStart,
    dateTimeEnd,
    phoneNumber,
    pin,
    voxApiUrl
  });
  //-------------------------------------------------------------------------------


  const [isInputsVisible, setIsInputsVisible] = useState(false);

  const { t } = useTranslation();

  const displayInputs = () => {
    setIsInputsVisible(prev => !prev);
  }

  return (
    <div className={styles.homeContent}>
      <h1 className={styles.homeTitle}>{t('homeModes.visio.title')}</h1>
      <p>{t('homeModes.visio.paragraph')}</p>
      <div className={styles.homepageDispositionSideBlocks}>
        <div className={styles.inputsBlock}>
          <div className={styles.inputsRoom}>
            <div className={styles.joinPart}>
              <Input
                label=""
                id="conferenceName"
                nativeInputProps={{
                  placeholder: t('homeModes.visio.input_room'),
                  value: props.conferenceName,
                  onChange: e => {
                    const value = e.currentTarget.value;
                    props.setConferenceName(value);
                  },
                  ref: props.inputRef,
                }}
                style={{ width: '100%' }}
                addon={
                  <Button className={styles.plusButton} onClick={props.handleGenerateRoomName} type="button">
                    <ShuffleIcon />
                  </Button>
                }
              />
            </div>
          </div>

          <div className={styles.buttonsSection}>
            <div className={styles.joinPart}>
              <div className={styles.joinInput}>
                <Button onClick={props.onSubmit} className={styles.joinButton} style={{ width: '100%' }} disabled={props.isError}>
                  <span>{t('homeModes.visio.join_button')}</span>
                </Button>
              </div>
              {isInputsVisible && (
                <div className={styles.hiddenDropdownButtons}>
                  <Button className={styles.joinButton} onClick={() => calendarModal.open()} priority="tertiary" disabled={props.isError} >
                    <span>{t('homeModes.visio.schedule_button')}</span>
                  </Button>
                  <Button className={styles.joinButton} onClick={props.onCopyLink} priority="tertiary" disabled={props.isError}>
                    <span>{t('homeModes.visio.copy_link')}</span>
                  </Button>
                </div>
              )}
              {props.isAlertVisible && (
                <div className={styles.alertContainer}>
                  <Alert severity="success" title={t('homeModes.visio.success_copy_link')} description="" small />
                </div>
              )}
            </div>
            <div>
              <Button className={styles.dropdownButton} onClick={displayInputs} type="button">
                {isInputsVisible ? "--" : "+"}
              </Button>
            </div>
          </div>
        </div>
        {props.conferenceName && (
          <div className={styles.validationMsg}>
            {!validateConferenceName(props.conferenceName).isValidDigits ? (
              <Badge className={styles.badge} severity="error">
                {t('homeForm.atLeast') + ' ' + cfg.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS + ' ' + t('homeForm.digits')}
              </Badge>
            ) : (
              <Badge className={styles.badge} severity="success">
                {t('homeForm.atLeast') + ' ' + cfg.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS + ' ' + t('homeForm.digits')}
              </Badge>
            )}
            {!validateConferenceName(props.conferenceName).isValidLength ? (
              <Badge className={styles.badge} severity="error">
                {t('homeForm.between') + ' ' + cfg.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINLENGTH + ' ' + t('homeForm.and') + ' ' + cfg.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MAXLENGTH + ' ' + t('homeForm.chars')}
              </Badge>
            ) : (
              <Badge className={styles.badge} severity="success">
                {t('homeForm.between') + ' ' + cfg.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MINLENGTH + ' ' + t('homeForm.and') + ' ' + cfg.VITE_FRONTCONF_ROOMNAMECONSTRAINT_MAXLENGTH + ' ' + t('homeForm.chars')}
              </Badge>
            )}
            {!validateConferenceName(props.conferenceName).isValidRegex ? (
              <Badge className={styles.badge} severity="error">
                {t('homeForm.digitsAndLetters')}
              </Badge>
            ) : (
              <Badge className={styles.badge} severity="success">
                {t('homeForm.digitsAndLetters')}
              </Badge>
            )}
          </div>
        )}
        <Badge severity="info">
          {t('homeForm.stats', {
            conferenceNumber: props.conferenceNumber,
            participantNumber: props.participantNumber
          })}
        </Badge>
      </div>
      <calendarModal.Component title={t('homeModes.visio.schedule_button')} size="large" className={styles.calendarModal} apitechCustomCloseText={t('modal.close')}>
        <br />
        <h6>{t('homeModes.visio.calendarModal.invitation')} : {roomName}</h6>
        <p>
          <Input
            label={<small id="input1-desc-error">{t('homeModes.visio.calendarModal.start_date')} :</small>}
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
                {t('homeModes.visio.calendarModal.duration')}{' '}
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
        {/* {voxApiUrl && phoneNumber && pin && ( */}
          <>
            <h6>{t('homeModes.visio.calendarModal.phone_details')} :</h6>
            <p>- {t('homeModes.visio.calendarModal.phone_number')} : {phoneNumber}</p>
            <p>- {t('homeModes.visio.calendarModal.pin')} : {`${pin}#`}</p>
          </>
        {/* )} */}
        <Snackbar
          open={open}
          autoHideDuration={6000}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Alert severity="success" title={t('homeModes.visio.success_copy_link')} description="" small />
        </Snackbar>

        <div className={styles.calendarModalButtons}>
          <ICalendarLink
            event={event}
            className={styles.modalButton}
            filename={`${props.AppTemplate === 'webconf' ? 'Webconférence de l\'État :' : 'Visio by Apitech'} - Conférence ${roomName}`}
          >
            <Button className={styles.joinButton}>
              {t('homeModes.visio.calendarModal.add_button')}
            </Button>
          </ICalendarLink>
          <Button
            className={styles.joinButton}
            onClick={() => copyEvent()}
            disabled={disabled}
            type="button"
          // nativeButtonProps={{ id: 'copyCalendarButton' }}
          >
            {t('homeModes.visio.calendarModal.copy_button')}
          </Button>
        </div>
      </calendarModal.Component>
    </div>
  )
};

export default VisioMode;