import { useState, FormEvent } from 'react';

import { Input } from '@apitechfr/react-dsapitech/Input';
import { Button } from '@apitechfr/react-dsapitech/Button';
import { Alert } from '@apitechfr/react-dsapitech/Alert';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useRuntimeConfig } from '@/config/ConfigProvider';

import styles from "../../pages/Home/HomeJoona.module.css"
import { useTranslation } from 'react-i18next';

interface VisioModeProps {
  readonly isError: boolean;
  readonly showError: boolean;
  readonly isAlertVisible: boolean;
  readonly conferenceName: string;
  readonly setConferenceName: (conferenceName: string) => void;
  readonly onclickGenerateRoomName: () => void;
  readonly handleGenerateRoomName: () => void;
  readonly onSubmit: (e: FormEvent) => void;
  readonly onCopyLink: () => void;
  readonly AppTemplate: string;
  readonly inputRef: React.RefObject<HTMLInputElement>;
}

function VisioMode(props: VisioModeProps) {

  const [isInputsVisible, setIsInputsVisible] = useState(false);
  const cfg = useRuntimeConfig();

  const { t } = useTranslation();

  const displayInputs = () => {
    setIsInputsVisible(prev => !prev);
  }

  return (
    <div className={styles.homeContent}>
      <h1 className={styles.homeTitle}>{t('home_title')}</h1>
      <p>{t('home_paragraph')}</p>
      <div className={styles.homepageDispositionSideBlocks}>
        <div className={styles.inputsBlock}>
          <div className={styles.inputsRoom}>
            <div className={styles.joinPart}>
              <Input
                label=""
                id="conferenceName"
                state={props.showError ? 'error' : 'default'}
                nativeInputProps={{
                  placeholder: t('input_room'),
                  value: props.conferenceName,
                  onChange: e => {
                    // change(e.target.value);

                    // MIT EN COMM EN ATTENTE DE MODIF REGEX

                    const value = e.currentTarget.value;
                    props.setConferenceName(value);
                    // props.setIsError(!props.isValidConferenceName(value));
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
                <Button onClick={props.onSubmit} className={styles.joinButton} style={{ width: '100%' }} disabled={props.isError}>
                  <span>{t('join_button')}</span>
                </Button>
              </div>
              {isInputsVisible && (
                <div className={styles.hiddenDropdownButtons}>
                  <Button className={styles.joinButton} onClick={function noRefCheck() { }} priority="tertiary" disabled>
                    <span>{t('schedule_button')}</span>
                  </Button>
                  <Button className={styles.joinButton} onClick={props.onCopyLink} priority="tertiary">
                    <span>{t('copy_link')}</span>
                  </Button>
                </div>
              )}
              {props.isAlertVisible && (
                <div className={styles.alertContainer}>
                  <Alert severity="success" title={t('success_copy_link')} description="" small />
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
        {/* <div>{message}</div> */}
        {/* <Badge severity="info">
              Actuellement, il y a {props.conferenceNumber} conférences et{' '}
              {props.participantNumber} participants.
            </Badge> */}
      </div>
    </div>
  )
};

export default VisioMode;