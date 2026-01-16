import { useTranslation } from 'react-i18next';
import Button from '@apitechfr/react-dsapitech/Button';
import { Alert } from '@apitechfr/react-dsapitech/Alert';
import { useRuntimeConfig } from '../../../../config/ConfigProvider';

import styles from './FeedbackJoona.module.css';
import { useEffect, useMemo, useState } from 'react';
import { FieldComponent } from '../../components/Feedbacks/FieldComponent';
import { FeedbackService, useApi } from '@/api';
import type { FeedbackTemplate } from '@/api';
import { useLocation, useNavigate } from 'react-router';

function FeedbackJoona() {
    const { t } = useTranslation();
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
            conferenceUuid: room,
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
            <h1 className={styles.title}>{t('feedback.serviceQuality')}</h1>

            {(() => {
                if (!isSubmitted) {
                    if (loading) {
                        return <span>{t('feedback.loading')}</span>;
                    } else if (error) {
                        return <span>{t('feedback.loadingError')}: {error.message}</span>;
                    } else if (templates.length > 0) {
                        return (
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
                                            <span>{isBusy ? t('feedback.sending') : t('feedback.send')}</span>
                                        </Button>
                                        {sendError && (
                                            <div className={styles.alertContainer}>
                                                <Alert
                                                    severity="error"
                                                    title={t('feedback.sendErrorTitle')}
                                                    description={sendError.message}
                                                    small
                                                />
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>
                        );
                    } else {
                        return (
                            <>
                                <span>{t('feedback.noFeedback')}</span>
                                <p>
                                    {t('feedback.backHomeHere')}: <a href="/">{t('header.home')}</a>
                                </p>
                            </>
                        );
                    }
                } else if (isBlankNewPage) {
                    return (
                        <>
                            <span>{t('feedback.thankYouShort')}</span>
                            <p>
                                {t('feedback.closeWindow')}
                            </p>
                            {isAlertVisible && (
                                <div className={styles.alertContainer}>
                                    <Alert
                                        severity="success"
                                        title={t('feedback.submitted')}
                                        description=""
                                        small
                                    />
                                </div>
                            )}
                        </>
                    );
                } else {
                    return (
                        <>
                            <span>
                                {t('feedback.thankYouRedirect')}
                            </span>
                            <p>
                                {t('feedback.notRedirected')}: <a href="/">{t('header.home')}</a>
                            </p>
                            {isAlertVisible && (
                                <div className={styles.alertContainer}>
                                    <Alert
                                        severity="success"
                                        title={t('feedback.submitted')}
                                        description=""
                                        small
                                    />
                                </div>
                            )}
                        </>
                    );
                }
            })()}
        </div>
    );
}

export default FeedbackJoona;
