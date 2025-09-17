import Button from '@apitechfr/react-dsapitech/Button';

import styles from './FeedbackJoona.module.css'
import { useEffect, useState } from 'react';
import { FieldComponent } from '../../../components/joona/feedbacks/FieldComponent';

export interface FeedbackType {
  id: number;
  name: string;
  description: string;
}

export interface Feedback {
  id: number;
}

export interface FeedbackTemplate {
  id: number;
  label: string;
  organization: string;
  choices: string[];
  deletedAt: string | null;
  feedbacks: Feedback[];
  type: FeedbackType;
}

const organizationFilter = import.meta.env.VITE_APP_ORGANIZATION;
const baseUrl = import.meta.env.VITE_API_URL;

function FeedbackJoona() {

    const [templates, setTemplates] = useState<FeedbackTemplate[]>([]);
    const [responses, setResponses] = useState<Record<number, string>>({});

    useEffect(() => {
        fetch(`${baseUrl}/feedback/templates`)
        .then((res) => res.json())
        .then((data: FeedbackTemplate[]) => {
            const filtered = data.filter(
                (template) => template.deletedAt === null && template.organization === organizationFilter
            );
            setTemplates(filtered);
        });
    }, []);


    const handleChange = (templateId: number, value: string) => {
        setResponses((previousData) => ({ ...previousData, [templateId]: value }));
    };

    const handleSubmit = async (e : React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const baseData = {
            conferenceUuid: "123e4567-e89b-12d3-a456-426614174000", // à remplacer par le nom de la conf plus tard
            date: new Date().toISOString(),
            userAgent: navigator.userAgent,
        };

        const feedbacks = templates.map((template) => ({
            ...baseData,
            feedbackTemplateId: template.id,
            reponse: responses[template.id] ?? "",
        }));

        try {
            const response = await fetch(
                `${baseUrl}/feedback/internal/bulk`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(feedbacks),
                }
            );

            if (response.ok) {
                alert("Feedback envoyé avec succès !");
            } else {
                console.error("Erreur :", await response.text());
            }
        } catch (err) {
            console.error("Erreur réseau :", err);
        }

        alert("Votre avis à été soumis, merci");
    }

    return (
        <div className={styles.content}>
            <h1 className={styles.title}>Mesurez la qualité du service</h1>
            <div className={styles.contentFeedback}>
                <form action="" onSubmit={e => handleSubmit(e)}>
                    {templates.map((template) => {
                        const Component = FieldComponent[template.type.id];
                        if (!Component) return null;
                        return (
                            <div key={template.id}>
                                <Component template={template} value={responses[template.id]} onChange={handleChange} />
                            </div>
                        );
                    })}
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