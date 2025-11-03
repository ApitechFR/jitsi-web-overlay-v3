import React from 'react';
import styles from './HomeJoona.module.css';

interface ConferenceWaitingModalProps {
    modal: any;
    authenticated: boolean;
    stopWaitingAndPoll: () => void;
    login: (roomName?: string) => void;
    conferenceName: string;
    validateConferenceName: (name: string) => boolean;
}

export const ConferenceWaitingModal: React.FC<ConferenceWaitingModalProps> = ({
    modal,
    authenticated,
    stopWaitingAndPoll,
    login,
    conferenceName,
    validateConferenceName,
}) => (
    <modal.Component
        title=""
        concealingBackdrop={false}
        buttons={[
            !authenticated && {
                children: "S'authentifier",
                priority: 'primary',
                onClick: () => {
                    stopWaitingAndPoll();
                    login(validateConferenceName(conferenceName) ? conferenceName : undefined);
                },
                doClosesModal: false,
            },
            {
                children: "Annuler l’attente",
                priority: 'secondary',
                onClick: () => stopWaitingAndPoll(),
                doClosesModal: false,
            },
        ].filter(Boolean) as any}
    >
        <div className={styles.contentModal}>
            <h1>La conférence n'a pas encore démarré</h1>
            <p>
                Si vous disposez d'un compte <b>Visio By Apitech</b> vous pouvez vous authentifier,
                sinon merci de patienter. Vous serez connecté automatiquement dès le démarrage.
            </p>
        </div>
    </modal.Component>
);
