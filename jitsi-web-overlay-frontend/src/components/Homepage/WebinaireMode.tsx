import { FormEvent, useState } from 'react';

import { Alert, Input, Button, Badge } from '@ds';

import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useRuntimeConfig } from '@/config/ConfigProvider';

import { createModal } from '@apitechfr/react-dsapitech/Modal';


import styles from "../../pages/Home/HomeJoona.module.css"
import { ConferenceService } from '@/api';
import { t } from 'i18next';
import { ConferenceNameValidation } from '@/utils/conferenceName';
import { validateConferenceName } from '@/utils/conferenceName';

interface WebinaireMode {
  readonly isError: boolean;
  readonly conferenceName: string;
  readonly setConferenceName: (conferenceName: string) => void;
  readonly onclickGenerateRoomName: () => void;
  readonly handleGenerateRoomName: () => void;
  readonly onSubmit: (e: FormEvent) => void;
  readonly isValidConferenceName: (name: string) => ConferenceNameValidation;
  readonly AppTemplate: string;
  readonly inputRef: React.RefObject<HTMLInputElement>;
}

const modal = createModal({
  id: 'webinaire-modal',
  isOpenedByDefault: false,
});

function WebinaireMode(props: WebinaireMode) {
  const cfg = useRuntimeConfig();
  const [alertMsg, setAlertMsg] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  // Copy participant link
  const handleCopyParticipant = async () => {
    if (!props.conferenceName || !props.isValidConferenceName(props.conferenceName).isValidConfName) return;
    const url = `${window.location.origin}/${props.conferenceName}`;
    try {
      await navigator.clipboard.writeText(url);
      setAlertMsg(t('homeModes.webinar.copy_success_participant', 'Lien participant copié !'));
    } catch {
      setAlertMsg(t('homeModes.webinar.copy_error', 'Erreur lors de la copie'));
    }
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  // Copy visitor link 
  const handleCopyVisitor = async () => {
    if (!props.conferenceName || !props.isValidConferenceName(props.conferenceName).isValidConfName) return;
    try {
      const res = await ConferenceService.jitsiVisitorJwt(props.conferenceName);
      const invitationToken = (res as any).invitationToken || (res as any).token;
      if (!invitationToken) throw new Error('Aucun token invitation reçu');
      const url = `${globalThis.location.origin}/webinar/invite/${invitationToken}`;
      console.log("URL visiteur générée :", url);
      await navigator.clipboard.writeText(url);
      setAlertMsg(t('homeModes.webinar.copy_success_visitor', 'Lien spectateur copié !'));
    } catch {
      setAlertMsg(t('homeModes.webinar.copy_error_visitor', 'Erreur lors de la génération du lien spectateur'));
    }
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <>
      <div className={styles.homeContent}>
        <h1 className={styles.homeTitle}>{t('homeModes.webinar.title')}</h1>
        <p>{t('homeModes.webinar.paragraph')}</p>
        <div className={styles.homepageDispositionSideBlocks}>
          <div className={styles.inputsBlock}>
            <div className={styles.inputsRoom}>
              <div className={styles.joinPart}>
                <Input
                  label=""
                  id="conferenceName"
                  // state={props.showError ? 'error' : 'default'}
                  nativeInputProps={{
                    placeholder: t('homeModes.webinar.input_room'),
                    value: props.conferenceName,
                    onChange: e => {
                      const value = e.currentTarget.value;
                      props.setConferenceName(value);
                    },
                    ref: props.inputRef,
                  }}
                  // stateRelatedMessage={
                  //   props.showError && (cfg.VITE_CONFERENCE_NAME_REGEX_MESSAGE || t('homeModes.webinar.invalid_conference_name', 'Nom de conférence invalide.'))}
                  style={{ width: '100%' }}
                  addon={
                    <Button className={styles.plusButton} onClick={props.AppTemplate === 'webconf' ? props.onclickGenerateRoomName : props.handleGenerateRoomName} type="button">
                      <ShuffleIcon />
                    </Button>
                  }
                />
              </div>
            </div>

            <div className={styles.buttonsSection}>
              <div className={styles.joinPart}>
                <div className={styles.joinInput}>
                  <Button onClick={() => modal.open()} className={styles.joinButton} style={{ width: '100%' }} disabled={props.isError}>
                    <span>{t('homeModes.webinar.join_button')}</span>
                  </Button>
                </div>
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
          {/* <Badge severity="info">
              Actuellement, il y a {props.conferenceNumber} conférences et{' '}
              {props.participantNumber} participants.
            </Badge> */}
        </div>
      </div>
      <modal.Component title={t('homeModes.webinar.modal_name')} size="large" className={styles.webinaireModal}>
        <div className={styles.modalContainer}>
          <h1 className={styles.modalWebinaireTitle}>{t('homeModes.webinar.modal_title')}<span>{props.conferenceName}</span></h1>
          <div className={styles.mainButtonsBlock}>
            <Button onClick={handleCopyParticipant} className={styles.joinButton}>
              {t('homeModes.webinar.copy_link_participant')}
            </Button>
            <Button onClick={handleCopyVisitor} className={styles.joinButton}>
              {t('homeModes.webinar.copy_link_visitor')}
            </Button>
          </div>
          {showAlert && (
            <div className={styles.alertContainer}>
              <Alert severity="success" title={alertMsg} description="" small />
            </div>
          )}
          <div className={styles.bottomButtonBlock}>
            <Button
              onClick={(e) => {
                if (!props.isError) {
                  const fakeEvent = { preventDefault: () => { } } as FormEvent;
                  props.onSubmit(fakeEvent);
                }
              }}
              className={styles.joinButton}
              priority="tertiary"
              disabled={props.isError}
            >
              {t('homeModes.webinar.modal_button')}
            </Button>
            <Button onClick={function noRefCheck() { }} className={styles.joinButton}>
              {t('homeModes.webinar.modal_button_finish')}
            </Button>
          </div>
        </div>
      </modal.Component>
    </>
  )
};

export default WebinaireMode;