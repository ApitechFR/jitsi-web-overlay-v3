import Button from '@apitechfr/react-dsapitech/Button';

import styles from './Frame.module.css'
// import { useNavigate } from 'react-router-dom';

function JitsiFrame() {
    // const navigate = useNavigate()

    return (
        <div className={styles.popupBoxContent}>
            <div className={styles.boxFrame}>
                <iframe src='/WhatsNew/test.html' className={styles.iframeContent}></iframe>
            </div>
            <div className={styles.frameContainerButton}>
                <Button
                    className={styles.buttonMoreInfo}
                    onClick={() => window.location.href = '/WhatsNew/test.html'}
                >
                    <span>Voir plus</span>
                </Button>
            </div>
        </div>
    )
}

export default JitsiFrame;