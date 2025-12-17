import { useState, FormEvent } from 'react';

import { Input } from '@apitechfr/react-dsapitech/Input';
import { Button } from '@apitechfr/react-dsapitech/Button';
import { Alert } from '@apitechfr/react-dsapitech/Alert';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useRuntimeConfig } from '@/config/ConfigProvider';

import styles from "../../pages/Home/HomeJoona.module.css"

interface VisioModeProps {
  readonly isError: boolean;
  readonly setIsError: (isError: boolean) => void;
  readonly isAlertVisible: boolean;
  readonly conferenceName: string;
  readonly setConferenceName: (conferenceName: string) => void;
  readonly onclickGenerateRoomName: () => void;
  readonly handleGenerateRoomName: () => void;
  readonly onSubmit: (e: FormEvent) => void;
  readonly isValidConferenceName: (name: string) => boolean;
  readonly onCopyLink: () => void;
  readonly AppTemplate: string;
  readonly inputRef: React.RefObject<HTMLInputElement>;
}

function VisioMode (props: VisioModeProps) {
    
    const [isInputsVisible, setIsInputsVisible] = useState(false);
    const cfg = useRuntimeConfig();
    
    const displayInputs = () => {
      setIsInputsVisible(prev => !prev);
    }

    return (
        <div className={styles.homeContent}>
          <h1 className={styles.homeTitle}>Rejoindre une visioconférence</h1>
          <p>Audio, vidéo, chat, partage d'écran et de documents</p>
          <div className={styles.homepageDispositionSideBlocks}>
            <div className={styles.inputsBlock}>
              <div className={styles.inputsRoom}>
                <div className={styles.joinPart}>
                  <Input
                    label=""
                    id="conferenceName"
                    state={props.isError && props.conferenceName ? 'error' : 'default'}
                    nativeInputProps={{
                      placeholder: 'Saisissez votre nom de conférence',
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
                      props.isError && props.conferenceName && (cfg.VITE_CONFERENCE_NAME_REGEX_MESSAGE || 'Nom de conférence invalide.')
                    }
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
                      <span>Rejoindre ou créer</span>
                    </Button>
                  </div>
                  {isInputsVisible && (
                    <div className={styles.hiddenDropdownButtons}>
                      <Button className={styles.joinButton} onClick={function noRefCheck(){}} priority="tertiary" disabled>
                        <span>Planifier une réunion</span>
                      </Button>
                      <Button className={styles.joinButton} onClick={props.onCopyLink} priority="tertiary">
                        <span>Copier le lien</span>
                      </Button>
                    </div>
                  )}
                  {props.isAlertVisible && (
                    <div className={styles.alertContainer}>
                      <Alert severity="success" title="Lien copié avec succès !" description="" small />
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