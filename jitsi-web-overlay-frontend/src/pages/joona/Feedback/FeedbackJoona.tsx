// import { Range } from "@codegouvfr/react-dsfr/Range";
import Input from '@codegouvfr/react-dsfr/Input';

import styles from './FeedbackJoona.module.css'
import Button from '@codegouvfr/react-dsfr/Button';


function FeedbackJoona () {

    return (
        <div className={styles.content}>
            <h1 className={styles.title}>Mesurez la qualité du service</h1>
            <div className={styles.contentFeedback}>
                {/* <Range
                    hintText="Texte de description additionnel, valeur de 0 à 100."
                    label="Label"
                    max={100}
                    min={0}
                /> */}
                <Input
                    label="Laissez un commentaire."
                    textArea
                />
                <div className={styles.validButtonFeedback}>
                    <Button>
                        <span>Valider</span>
                    </Button>
                </div>
            </div>
        </div>
    )
};

export default FeedbackJoona;