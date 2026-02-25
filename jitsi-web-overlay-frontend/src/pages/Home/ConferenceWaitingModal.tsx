import React, { useEffect, useState } from 'react';
import styles from './HomeJoona.module.css';
import { useTranslation } from 'react-i18next';
import { ConferenceNameValidation } from '@/utils/conferenceName';
import { loadRuntimeConfig } from '@/config/runtimeConfig';

import { AgentConnectButton, Input, Checkbox, Button, Badge } from "@ds";

interface ConferenceWaitingModalProps {
    modal: any;
    authenticated: boolean;
    stopWaitingAndPoll: () => void;
    login: (roomName?: string) => void;
    conferenceName: string;
    validateConferenceName: (name: string) => ConferenceNameValidation;
    appTemplate: string;
    email: string;
    isWhitelisted: boolean | null;
    setEmail: (mail: string) => void;
    sendEmail: (mail: string) => void;
    setIsWhitelisted: (whitelisted: boolean | null) => void;
}

export const ConferenceWaitingModal: React.FC<ConferenceWaitingModalProps> = ({
    modal,
    authenticated,
    stopWaitingAndPoll,
    login,
    conferenceName,
    validateConferenceName,
    appTemplate,
    email,
    isWhitelisted,
    setEmail,
    sendEmail,
    setIsWhitelisted
}) => {
    const { t } = useTranslation();
    const [isChecked, setIsChecked] = useState<boolean>(false);
    const [buttonMsg, setButtonMsg] = useState(
        t('conferenceWaitingModal.receiveCode')
    );
    const [resellerAuthUrl, setResellerAuthUrl] = useState<string | null>(null);
    const [isResellerMode, setIsResellerMode] = useState<boolean>(false);

    /** webconf **/
    const onCheck = () => {
        setIsChecked(!isChecked);
    };

    const agentConnect = (room: string) => {
        login(room);
    };

    const mailchanger = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const mailSender = (roomName: string) => {
        sendEmail(roomName);
        setButtonMsg(t('conferenceWaitingModal.emailNotReceived'));
    };

    const handleAuthenticationClick = () => {
        if (isResellerMode && resellerAuthUrl && validateConferenceName(conferenceName)) {
            // Reseller mode: redirect to authentication URL with conference name
            const authUrlWithRoom = `${resellerAuthUrl}?room=${encodeURIComponent(conferenceName)}`;
            window.location.href = authUrlWithRoom;
        } else {
            // Standard mode: use login function
            stopWaitingAndPoll();
            login(validateConferenceName(conferenceName) ? conferenceName : undefined);
        }
    };

    useEffect(() => {
        setIsWhitelisted(null);
        setEmail('');
        setIsChecked(false);
        setButtonMsg(t('conferenceWaitingModal.receiveCode'));
    }, [setEmail, setIsWhitelisted, t]);

    useEffect(() => {
        // Load runtime config to get reseller settings
        loadRuntimeConfig().then((config) => {
            const resellerModeEnabled = config.VITE_RESELLER_MODE_ENABLED === true || config.VITE_RESELLER_MODE_ENABLED === 'true';
            const authUrl = config.VITE_RESELLER_AUTH_URL;

            setIsResellerMode(resellerModeEnabled);
            if (authUrl) {
                setResellerAuthUrl(authUrl);
            }
        }).catch((error) => {
            console.error('Failed to load runtime config:', error);
        });
    }, []);

    return (
        <modal.Component
            title=""
            concealingBackdrop={false}
            className={styles.conferenceWaitingModal}
            apitechCustomCloseText={t('modal.close')}
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
                        <AgentConnectButton onClick={() => agentConnect(conferenceName)} />
                        <div className={styles.modalInputBlock}>
                            <Input
                                label={t('conferenceWaitingModal.emailLabel')}
                                id="mailConnection"
                                nativeInputProps={{
                                    'aria-describedby': 'input3-desc-error',
                                    'aria-labelledby': 'input3-desc-error',
                                    id: 'input3',
                                    value: email,
                                    onChange: mailchanger,
                                    required: true,
                                }}
                            />
                            <Checkbox
                                options={[
                                    {
                                        label: t('conferenceWaitingModal.rememberMe'),
                                        nativeInputProps: {
                                            name: 'checkboxes-1',
                                            value: 'value1',
                                            onChange: onCheck,
                                            checked: isChecked,
                                        }
                                    }
                                ]}
                                state="default"
                            />
                            <Button priority="primary" onClick={() => mailSender(conferenceName)}>
                                <span>{buttonMsg}</span>
                            </Button>
                            {isWhitelisted === false && (
                                <p>
                                    <Badge severity="error">
                                        {t('conferenceWaitingModal.emailNotValid')}
                                    </Badge>
                                </p>
                            )}
                            {isWhitelisted === true && (
                                <p>
                                    <Badge severity="success">{t('conferenceWaitingModal.messageSent')}</Badge>
                                </p>
                            )}
                        </div>
                    </>
                )}
                {appTemplate === 'joona' && !authenticated && (
                    <Button priority="primary" onClick={handleAuthenticationClick}>
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
