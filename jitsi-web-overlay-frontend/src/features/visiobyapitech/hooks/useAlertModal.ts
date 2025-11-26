import { useRef } from 'react';
import { createModal } from '@apitechfr/react-dsapitech/Modal';

let singletonModal: any = null;

export function useAlertModal() {
    const modalRef = useRef<any>(null);

    const showModal = (msg: string) => {
        if (!singletonModal) {
            singletonModal = createModal({
                id: 'dsapitech-alert-modal',
                isOpenedByDefault: true,
            });
            singletonModal.setContent(msg);
        } else {
            singletonModal.setContent(msg);
        }
        singletonModal.open();
    };

    return showModal;
}
