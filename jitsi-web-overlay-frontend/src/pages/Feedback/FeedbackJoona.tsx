import { Alert, Button } from '@ds';
import { useRuntimeConfig } from '@/config/ConfigProvider';

import styles from './FeedbackJoona.module.css';
import { useEffect, useMemo, useState } from 'react';
import { FieldComponent } from '../../components/Feedbacks/FieldComponent';
import { FeedbackService, useApi } from '@/api';
import type { FeedbackTemplate } from '@/api';
import { useLocation, useNavigate } from 'react-router';

function FeedbackJoona() {
    const cfg = useRuntimeConfig();
    const organizationFilter = cfg.VITE_APP_ORGANIZATION;

    const navigate = useNavigate();

    const [templates, setTemplates] = useState<FeedbackTemplate[]>([]);
    const [responses, setResponses] = useState<Record<number, string>>({});
    const [isBlankNewPage, setIsBlankNewPage] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const location = useLocation();

    const params = new URLSearchParams(window.location.search);

    const room = location.state?.room || params.get('room');

    // useApi hooks
    const { run: fetchTemplates, loading, error } = useApi(FeedbackService.listTemplates);
    const { run: sendFeedbacks, loading: sending, error: sendError } = useApi(FeedbackService.bulkCreate);

    useEffect(() => {
        fetchTemplates()
            .then((allTemplates) => {
                const filtered = allTemplates.filter(
                    (template: FeedbackTemplate) => template.deletedAt === null && template.organization === organizationFilter
                );
                setTemplates(filtered);
            })
            .catch(() => {
                /* l'erreur est déjà exposée via error */
            });
    }, [fetchTemplates]);

    useEffect(() => {
        if (!isSubmitted) return;

        if (isAlertVisible) {
            const timeout = setTimeout(() => setIsAlertVisible(false), 3000);
            return () => clearTimeout(timeout);
        }

        const timer = setTimeout(() => {
            if (isBlankNewPage) window.close();
            else navigate('/');
        }, 4500);

        return () => clearTimeout(timer);
    }, [isSubmitted, isAlertVisible, isBlankNewPage, navigate]);

    const handleChange = (templateId: number, value: string) => {
        setResponses((previous) => ({ ...previous, [templateId]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const baseData = {
            conferenceUuid: room, // à remplacer par le nom de la conf plus tard
            date: new Date().toISOString(),
            userAgent: navigator.userAgent,
        };

        const payload = templates.map((template) => ({
            ...baseData,
            feedbackTemplateId: template.id,
            reponse: responses[template.id] ?? '',
        }));

        try {
            await sendFeedbacks(payload);
            if (params.get('src') === 'visio') setIsBlankNewPage(true);
            setIsSubmitted(true);
            setIsAlertVisible(true);
        } catch {
            /* déjà géré via sendError */
        }
    };

    const isBusy = useMemo(() => loading || sending, [loading, sending]);

    return (
        <div className={styles.content}>
            <h1 className={styles.title}>Mesurez la qualité du service</h1>

            {!isSubmitted ? (
                loading ? (
                    <span>Chargement des feedbacks…</span>
                ) : error ? (
                    <span>Erreur lors du chargement des feedbacks : {error.message}</span>
                ) : templates.length > 0 ? (
                    <div className={styles.contentFeedback}>
                        <form onSubmit={handleSubmit}>
                            {templates.map((template) => {
                                const Component = FieldComponent[template.type.name];
                                if (!Component) return null;
                                return (
                                    <div key={template.id}>
                                        <Component
                                            template={template}
                                            value={responses[template.id]}
                                            onChange={handleChange}
                                        />
                                    </div>
                                );
                            })}

                            <div className={styles.validButtonFeedback}>
                                <Button disabled={isBusy}>
                                    <span>{isBusy ? 'Envoi en cours…' : 'Envoyer'}</span>
                                </Button>
                                {sendError && (
                                    <div className={styles.alertContainer}>
                                        <Alert
                                            severity="error"
                                            title="Erreur lors de l'envoi"
                                            description={sendError.message}
                                            small
                                        />
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        <span>
                            Il n&apos;y a actuellement pas de feedback à afficher pour cette
                            organisation.
                        </span>
                        <p>
                            Retour à la page d&apos;accueil ici : <a href="/">Accueil</a>
                        </p>
                    </>
                )
            ) : isBlankNewPage ? (
                <>
                    <span>Merci pour votre retour !</span>
                    <p>
                        Vous pouvez désormais retourner à votre visioconférence et fermer
                        cette fenêtre, celle-ci sera automatiquement fermée d&apos;ici
                        quelques secondes.
                    </p>
                    {isAlertVisible && (
                        <div className={styles.alertContainer}>
                            <Alert
                                severity="success"
                                title="Votre avis a été soumis, Merci !"
                                description=""
                                small
                            />
                        </div>
                    )}
                </>
            ) : (
                <>
                    <span>
                        Merci pour votre retour ! Vous allez être redirigé automatiquement
                        vers la page d&apos;accueil.
                    </span>
                    <p>
                        Si ce n&apos;est pas le cas au bout de quelques secondes, vous
                        pouvez cliquer ici : <a href="/">Accueil</a>
                    </p>
                    {isAlertVisible && (
                        <div className={styles.alertContainer}>
                            <Alert
                                severity="success"
                                title="Votre avis a été soumis, Merci !"
                                description=""
                                small
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default FeedbackJoona;
