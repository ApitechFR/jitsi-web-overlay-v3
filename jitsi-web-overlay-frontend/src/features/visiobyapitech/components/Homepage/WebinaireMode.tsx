import { FormEvent, useState } from 'react';

import { Alert } from '@apitechfr/react-dsapitech/Alert';

import { Input } from '@apitechfr/react-dsapitech/Input';
import { Button } from '@apitechfr/react-dsapitech/Button';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useRuntimeConfig } from '@/config/ConfigProvider';

import { createModal } from '@apitechfr/react-dsapitech/Modal';


import styles from "../../pages/Home/HomeJoona.module.css"
import { ConferenceService } from '@/api';
import { t } from 'i18next';

interface WebinaireMode {
  readonly isError: boolean;
  readonly showError: boolean;
  readonly conferenceName: string;
  readonly setConferenceName: (conferenceName: string) => void;
  readonly onclickGenerateRoomName: () => void;
  readonly handleGenerateRoomName: () => void;
  readonly onSubmit: (e: FormEvent) => void;
  readonly isValidConferenceName: (name: string) => boolean;
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

  // Copie le lien participant (classique)
  const handleCopyParticipant = async () => {
    if (!props.conferenceName || !props.isValidConferenceName(props.conferenceName)) return;
    const url = `${window.location.origin}/${props.conferenceName}`;
    try {
      await navigator.clipboard.writeText(url);
      setAlertMsg('Lien participant copié !');
    } catch {
      setAlertMsg('Erreur lors de la copie');
    }
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  // Copie le lien visiteur (visitor/JWT)
  const handleCopyVisitor = async () => {
    if (!props.conferenceName || !props.isValidConferenceName(props.conferenceName)) return;
    try {
      const res = await ConferenceService.jitsiVisitorJwt(props.conferenceName);
      const invitationToken = (res as any).invitationToken || (res as any).token;
      if (!invitationToken) throw new Error('Aucun token invitation reçu');
      const url = `${globalThis.location.origin}/webinar/invite/${invitationToken}`;
      console.log("URL visiteur générée :", url);
      await navigator.clipboard.writeText(url);
      setAlertMsg('Lien spectateur copié !');
    } catch {
      setAlertMsg('Erreur lors de la génération du lien spectateur');
    }
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <>
      <div className={styles.homeContent}>
        <h1 className={styles.homeTitle}>{t('webinar_home_title')}</h1>
        <p>{t('webinar_home_paragraph')}</p>
        <div className={styles.homepageDispositionSideBlocks}>
          <div className={styles.inputsBlock}>
            <div className={styles.inputsRoom}>
              <div className={styles.joinPart}>
                <Input
                  label=""
                  id="conferenceName"
                  state={props.showError ? 'error' : 'default'}
                  nativeInputProps={{
                    placeholder: t('webinar_input_room'),
                    value: props.conferenceName,
                    onChange: e => {
                      // change(e.target.value);

                      // MIT EN COMM EN ATTENTE DE MODIF REGEX

                      const value = e.currentTarget.value;
                      props.setConferenceName(value);
                      // props.setIsError(!props.isValidConferenceName(value) || value.trim() === "");
                    },
                    ref: props.inputRef,
                  }}
                  stateRelatedMessage={
                    props.showError && (cfg.VITE_CONFERENCE_NAME_REGEX_MESSAGE || 'Nom de conférence invalide.')}
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
                    <span>{t('webinar_join_button')}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* <div>{message}</div> */}
          {/* <Badge severity="info">
              Actuellement, il y a {props.conferenceNumber} conférences et{' '}
              {props.participantNumber} participants.
            </Badge> */}
        </div>
      </div>
      <modal.Component title={t('modal_webinar_name')} size="large" className={styles.webinaireModal}>
        <div className={styles.modalContainer}>
          <h1 className={styles.modalWebinaireTitle}>{t('modal_webinar_title')}<span>{props.conferenceName}</span></h1>
          <div className={styles.mainButtonsBlock}>
            <Button onClick={handleCopyParticipant} className={styles.joinButton}>
              {t('copy_webinar_link_participant')}
            </Button>
            <Button onClick={handleCopyVisitor} className={styles.joinButton}>
              {t('copy_webinar_link_visitor')}
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
                // Simule un submit pour réutiliser la logique de HomeJoona
                if (!props.isError) {
                  // Crée un faux event pour onSubmit
                  const fakeEvent = { preventDefault: () => { } } as FormEvent;
                  props.onSubmit(fakeEvent);
                }
              }}
              className={styles.joinButton}
              priority="tertiary"
              disabled={props.isError}
            >
              {t('modal_webinar_button')}
            </Button>
            <Button onClick={function noRefCheck() { }} className={styles.joinButton}>
              {t('modal_webinar_button_finish')}
            </Button>
          </div>
        </div>
      </modal.Component>
    </>
  )
};

export default WebinaireMode;