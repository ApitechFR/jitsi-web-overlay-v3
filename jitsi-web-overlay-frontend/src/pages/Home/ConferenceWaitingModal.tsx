import React from 'react';
import styles from './HomeJoona.module.css';
import { useTranslation } from 'react-i18next';
import { ConferenceNameValidation } from '@/utils/conferenceName';

interface ConferenceWaitingModalProps {
    modal: any;
    authenticated: boolean;
    stopWaitingAndPoll: () => void;
    login: (roomName?: string) => void;
    conferenceName: string;
    validateConferenceName: (name: string) => ConferenceNameValidation;
}

export const ConferenceWaitingModal: React.FC<ConferenceWaitingModalProps> = ({
    modal,
    authenticated,
    stopWaitingAndPoll,
    login,
    conferenceName,
    validateConferenceName,
}) => {
    const { t } = useTranslation();
    const confNameValid = validateConferenceName(conferenceName);
    return (
        <modal.Component
            title=""
            concealingBackdrop={false}
            buttons={[
                !authenticated && {
                    children: t('conferenceWaitingModal.authenticate'),
                    priority: 'primary',
                    onClick: () => {
                        stopWaitingAndPoll();
                        login(confNameValid.isValidConfName ? conferenceName : undefined);
                    },
                    doClosesModal: false,
                },
                {
                    children: t('conferenceWaitingModal.cancel'),
                    priority: 'secondary',
                    onClick: () => stopWaitingAndPoll(),
                    doClosesModal: false,
                },
            ].filter(Boolean) as any}
        >
            <div className={styles.contentModal}>
                <h1>{t('conferenceWaitingModal.notStartedTitle')}</h1>
                <p>
                    {t('conferenceWaitingModal.notStartedMessage.part1')}
                    <b>Visio By Apitech</b>
                    {t('conferenceWaitingModal.notStartedMessage.part2')}
                </p>
            </div>
        </modal.Component>
    );
}
