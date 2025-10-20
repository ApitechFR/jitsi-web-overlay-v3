import Button from '@apitechfr/react-dsapitech/Button';
import { Alert } from '@apitechfr/react-dsapitech/Alert';
import styles from './FeedbackJoona.module.css'
import { useEffect, useState } from 'react';
import { FieldComponent } from '../../../components/joona/feedbacks/FieldComponent';
import { useNavigate } from 'react-router';
import { useRuntimeConfig } from '../../../config/ConfigProvider';
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



function FeedbackJoona() {
    const { VITE_APP_ORGANIZATION: organizationFilter, VITE_API_URL: baseUrl } = useRuntimeConfig();

    const navigate = useNavigate();

    const [templates, setTemplates] = useState<FeedbackTemplate[]>([]);
    const [responses, setResponses] = useState<Record<number, string>>({});
    const [isBlankNewPage, setIsBlankNewPage] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);

    const params = new URLSearchParams(window.location.search);

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

    useEffect(() => {
        if (isSubmitted) {
            if (isAlertVisible) {
                const timeout = setTimeout(() => setIsAlertVisible(false), 3000);
                return () => clearTimeout(timeout);
            }
            if (isBlankNewPage) {
                const timer = setTimeout(() => {
                    window.close();
                }, 4500);

                return () => clearTimeout(timer);
            } else {
                const timer = setTimeout(() => {
                    navigate('/');
                }, 4500);

                return () => clearTimeout(timer);
            }
        }
    }, [isSubmitted, isAlertVisible]);

    const handleChange = (templateId: number, value: string) => {
        setResponses((previousData) => ({ ...previousData, [templateId]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

            if (params.get("src") === "visio") {
                setIsBlankNewPage(true);
            }
            if (response.ok) {
                setIsSubmitted(true);
                setIsAlertVisible(true);
            } else {
                console.error("Erreur :", await response.text());
            }
        } catch (err) {
            console.error("Erreur réseau :", err);
        }
    }

    return (
        <div className={styles.content}>
            <h1 className={styles.title}>Mesurez la qualité du service</h1>
            {!isSubmitted ?
                (templates.length > 0 ? (
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
                ) : (
                    <>
                        <span>Il n'y a actuellement pas de feedback à afficher pour cette organisation</span>
                        <p>Retour à la page d'accueil ici : <a href="/">Accueil</a></p>
                    </>
                )) : isBlankNewPage ? (
                    <>
                        <span>Merci pour votre retour !</span>
                        <p>Vous pouvez désormais retourner à votre visioconférence et fermer cette fenêtre, celle-ci sera automatiquement fermer d'ici quelques secondes</p>
                        {isAlertVisible && (
                            <div className={styles.alertContainer}>
                                <Alert severity="success" title="Votre avis à été soumis, Merci !" description="" small />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <span>Merci pour votre retour ! Vous allez être redirigé automatiquement vers la page d'accueil</span>
                        <p>Si ce n'est pas le cas au bout de quelques secondes, vous pouvez cliquer ici pour y être redirigé : <a href="/">Accueil</a></p>
                        {isAlertVisible && (
                            <div className={styles.alertContainer}>
                                <Alert severity="success" title="Votre avis à été soumis, Merci !" description="" small />
                            </div>
                        )}
                    </>
                )}
        </div>
    )
};

export default FeedbackJoona;