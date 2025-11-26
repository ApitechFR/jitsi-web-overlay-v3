import React, { useState } from 'react';
import { createModal } from '@apitechfr/react-dsapitech/Modal';

const modal = createModal({
    id: 'dsapitech-alert-modal',
    isOpenedByDefault: false,
});
const ModalComponent = modal.Component;

export function useAlertModal() {
    const [message, setMessage] = useState<string | null>(null);

    const showModal = (msg: string) => {
        setMessage(msg);
        modal.open();
    };

    const AlertModal = () => (
        <ModalComponent title="Alerte">
            <div>{message}</div>
        </ModalComponent>
    );

    return [showModal, AlertModal] as const;
}
