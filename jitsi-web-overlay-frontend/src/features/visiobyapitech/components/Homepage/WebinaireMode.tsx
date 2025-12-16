import { FormEvent } from 'react';

import { Input } from '@apitechfr/react-dsapitech/Input';
import { Button } from '@apitechfr/react-dsapitech/Button';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useRuntimeConfig } from '@/config/ConfigProvider';

import { createModal } from '@apitechfr/react-dsapitech/Modal';


import styles from "../../pages/Home/HomeJoona.module.css"

interface WebinaireMode {
  readonly isError: boolean;
  readonly setIsError: (isError: boolean) => void;
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

function WebinaireMode (props: WebinaireMode) {
    
    const cfg = useRuntimeConfig();

    return (
      <>
        <div className={styles.homeContent}>
          <h1 className={styles.homeTitle}>Rejoindre un webinaire</h1>
          <p>Audio, vidéo, chat, partage d'écran et de documents</p>
          <div className={styles.homepageDispositionSideBlocks}>
            <div className={styles.inputsBlock}>
              <div className={styles.inputsRoom}>
                <div className={styles.joinPart}>
                  <Input
                    label=""
                    id="conferenceName"
                    state={props.isError ? 'error' : 'default'}
                    nativeInputProps={{
                      placeholder: 'Saisissez votre nom de conférence',
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
                      props.isError && (cfg.VITE_CONFERENCE_NAME_REGEX_MESSAGE || 'Nom de conférence invalide.')
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
                    <Button onClick={() => modal.open()} className={styles.joinButton} style={{ width: '100%' }} disabled={props.isError}>
                      <span>Créer et partager un webinaire</span>
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
        <modal.Component title="Créer et partager un webinaire" size="large" className={styles.webinaireModal}>
          <div className={styles.modalContainer}>
            <h1 className={styles.modalWebinaireTitle}>Nom du webinaire : <span>{props.conferenceName}</span></h1>
            <div className={styles.mainButtonsBlock}>
              <Button onClick={function noRefCheck(){}} className={styles.joinButton}>
                Copier le lien participant pour le partager aux animateurs
              </Button>
              <Button onClick={function noRefCheck(){}} className={styles.joinButton}>
                Copier le lien visiteur pour le partager aux spectateurs
              </Button>
            </div>
            <div className={styles.bottomButtonBlock}>
              <Button onClick={function noRefCheck(){}} className={styles.joinButton} priority="tertiary">
                Entrer dans le webinaire maintenant
              </Button>
              <Button onClick={function noRefCheck(){}} className={styles.joinButton}>
                Terminer
              </Button>
            </div>
          </div>
        </modal.Component>
      </>
    )
};

export default WebinaireMode;