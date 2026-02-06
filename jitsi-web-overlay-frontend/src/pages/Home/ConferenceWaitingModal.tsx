import React from 'react';
import styles from './HomeJoona.module.css';
import { useTranslation } from 'react-i18next';
import { ConferenceNameValidation } from '@/utils/conferenceName';

import { AgentConnectButton, Input, Checkbox, Button } from "@ds";

import { AgentConnectButton, Input, Checkbox, Button } from "@ds";

interface ConferenceWaitingModalProps {
    modal: any;
    authenticated: boolean;
    stopWaitingAndPoll: () => void;
    login: (roomName?: string) => void;
    conferenceName: string;
    validateConferenceName: (name: string) => boolean;
    appTemplate: string;
}

export const ConferenceWaitingModal: React.FC<ConferenceWaitingModalProps> = ({
    modal,
    authenticated,
    stopWaitingAndPoll,
    login,
    conferenceName,
    validateConferenceName,
    appTemplate
}) => {
    const { t } = useTranslation();
    const confNameValid = validateConferenceName(conferenceName);
    return (
        <modal.Component
            title=""
            concealingBackdrop={false}
            className={styles.conferenceWaitingModal}
        >
            <div className={styles.enterModal}>
                <div className={styles.modalMessage}>
                    <h1>{t('conferenceWaitingModal.organizerTitle')}</h1>
                    <p>
                        {t('conferenceWaitingModal.organizerMessage.part1')}
                        <strong>{conferenceName}</strong>
                        {t('conferenceWaitingModal.organizerMessage.part2')}
                    </p>
                </div>
                {appTemplate === 'webconf' && (
                    <>
                        <AgentConnectButton url="https://google.fr" />
                        <div className={styles.modalInputBlock}>
                            <Input
                            label={t('conferenceWaitingModal.emailLabel')}
                            id="mailConnection"
                            />
                            <Checkbox
                                options={[
                                    {
                                        label: t('conferenceWaitingModal.rememberMe'),
                                        nativeInputProps: {
                                            name: 'checkboxes-1',
                                            value: 'value1'
                                        }
                                    }
                                ]}
                                state="default"
                            />
                            <Button priority="primary" onClick={() => {}}>
                                <span>{t('conferenceWaitingModal.receiveCode')}</span>
                            </Button>
                        </div>
                    </>
                )}
                {appTemplate === 'joona' && !authenticated && (
                    <Button priority="primary" onClick={() => {
                        stopWaitingAndPoll();
                        login(validateConferenceName(conferenceName) ? conferenceName : undefined);
                    }}>
                        <span>{t('conferenceWaitingModal.authenticate')}</span>
                    </Button>
                )}
                <div className={styles.modalMessage}>
                    <h1>{t('conferenceWaitingModal.inviteeTitle')}</h1>
                    <p>
                        {t('conferenceWaitingModal.inviteeMessage.part1')}
                        <strong>{conferenceName}</strong>
                        {t('conferenceWaitingModal.inviteeMessage.part2')}
                    </p>
                </div>
            </div>
        </modal.Component>
    );
}
