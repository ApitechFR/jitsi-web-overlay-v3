import Input from '@apitechfr/react-dsapitech/Input';
import Button from '@apitechfr/react-dsapitech/Button';
import RadioButtons from '@apitechfr/react-dsapitech/RadioButtons';

import styles from './FeedbackJoona.module.css'
import StarRating from '../../../components/joona/stars/StarRating';
import { useState } from 'react';

function FeedbackJoona() {

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [opinion, setOpinion] = useState("");

    const handleSubmit = async (e : React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const baseData = {
            conferenceUuid: "123e4567-e89b-12d3-a456-426614174000", // à remplacer par le nom de la conf plus tard
            date: new Date().toISOString(),
            userAgent: navigator.userAgent,
        };

        // POST pour rating stars
        await fetch("http://localhost:3030/feedback/internal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            ...baseData,
            feedbackTemplateId: 1,
            reponse: String(rating),
            }),
        });

        // POST pour commentaire
        await fetch("http://localhost:3030/feedback/internal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            ...baseData,
            feedbackTemplateId: 2,
            reponse: comment,
            }),
        });

        // POST pour radio buttons
        await fetch("http://localhost:3030/feedback/internal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            ...baseData,
            feedbackTemplateId: 3,
            reponse: opinion,
            }),
        });

        alert("Votre avis à été soumis, merci");
    }

    return (
        <div className={styles.content}>
            <h1 className={styles.title}>Mesurez la qualité du service</h1>
            <div className={styles.contentFeedback}>
                <form action="" onSubmit={e => handleSubmit(e)}>
                    <StarRating rating={rating} changeRating={setRating} />
                    <Input
                        label="Laissez un commentaire."
                        textArea
                        nativeTextAreaProps={{
                            value: comment,
                            onChange: (e) => setComment(e.currentTarget.value)
                        }}
                    />
                    <RadioButtons
                        legend="Vous en pensez quoi ?"
                        name="radio"
                        options={[
                            {
                                label: 'Parfait',
                                nativeInputProps: {
                                    value: 'Parfait',
                                    checked: opinion === "Parfait",
                                    onChange: () => setOpinion("Parfait")
                                }
                            },
                            {
                                label: 'Moyen',
                                nativeInputProps: {
                                    value: 'Moyen',
                                    checked: opinion === "Moyen",
                                    onChange: () => setOpinion("Moyen")
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