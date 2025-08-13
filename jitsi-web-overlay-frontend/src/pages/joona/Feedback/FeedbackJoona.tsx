import Input from '@apitechfr/react-dsapitech/Input';
import Button from '@apitechfr/react-dsapitech/Button';
import RadioButtons from '@apitechfr/react-dsapitech/RadioButtons';

import styles from './FeedbackJoona.module.css'
import StarRating from '../../../components/joona/stars/StarRating';
import { useState } from 'react';

function FeedbackJoona() {

    const [rating, setRating] = useState(0);

    return (
        <div className={styles.content}>
            <h1 className={styles.title}>Mesurez la qualité du service</h1>
            <div className={styles.contentFeedback}>
                <form action="" onSubmit={e => e.preventDefault()}>
                    <StarRating rating={rating} changeRating={setRating} />
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
                                    value: 'good'
                                }
                            },
                            {
                                label: 'Moyen',
                                nativeInputProps: {
                                    value: 'medium'
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