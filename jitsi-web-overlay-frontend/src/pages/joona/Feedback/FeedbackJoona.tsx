import Input from '@codegouvfr/react-dsfr/Input';
import Button from '@codegouvfr/react-dsfr/Button';
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons';

import styles from './FeedbackJoona.module.css'
import StarRating from '../../../components/joona/stars/StarRating';


function FeedbackJoona () {

    return (
        <div className={styles.content}>
            <h1 className={styles.title}>Mesurez la qualité du service</h1>
            <div className={styles.contentFeedback}>
                <form action="">
                    <StarRating />
                    <Input
                        label="Laissez un commentaire."
                        textArea
                    />
                    <RadioButtons
                        legend="Vous en pensez quoi ?"
                        name="radio"
                        options={[
                            {
                            label: 'Parfait',
                            nativeInputProps: {
                                value: 'value1'
                            }
                            },
                            {
                            label: 'Moyen',
                            nativeInputProps: {
                                value: 'value2'
                            }
                            },
                        ]}
                        />
                    <div className={styles.validButtonFeedback}>
                        <Button>
                            <span>Envoyer</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
};

export default FeedbackJoona;