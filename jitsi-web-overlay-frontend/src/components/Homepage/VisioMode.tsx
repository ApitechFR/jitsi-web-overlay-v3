import { useState, FormEvent } from 'react';

import { Badge, Button, Alert, Input } from '@ds';

import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useRuntimeConfig } from '@/config/ConfigProvider';

import styles from "../../pages/Home/HomeJoona.module.css"
import { useTranslation } from 'react-i18next';
import { validateConferenceName } from '@/utils/conferenceName';

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

function VisioMode(props: VisioModeProps) {

  const [isInputsVisible, setIsInputsVisible] = useState(false);
  const cfg = useRuntimeConfig();

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
                  <Button className={styles.joinButton} onClick={function noRefCheck() { }} priority="tertiary" disabled>
                    <span>{t('homeModes.visio.schedule_button')}</span>
                  </Button>
                  <Button className={styles.joinButton} onClick={props.onCopyLink} priority="tertiary">
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
    </div>
  )
};

export default VisioMode;