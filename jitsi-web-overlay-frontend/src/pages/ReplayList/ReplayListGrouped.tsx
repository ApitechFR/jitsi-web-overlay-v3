import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi, ReplayService } from '@/api';
import styles from './ReplayList.module.css';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@codegouvfr/react-dsfr/Button';
import { formatReplayDate } from '@/utils/date';
import type { Replay } from '@/api';
import { useAuth } from '@/auth/useAuth';
import { getUserEmail } from '@/utils/user';


const ReplayListGrouped: React.FC = () => {

    const [groupedReplays, setGroupedReplays] = useState<Record<string, Replay[]>>({});
    const [downloading, setDownloading] = useState(false);
    const { t } = useTranslation();
    const { user } = useAuth();
    const userEmail = getUserEmail(user);

    const { run: fetchGrouped, loading, error } = useApi((email: string) => ReplayService.getReplaysByParticipantEmail(email));

    useEffect(() => {
        if (!userEmail) return;

        fetchGrouped(userEmail)
            .then(setGroupedReplays)
            .catch(() => { });
    }, [userEmail]);

    if (loading) return <p>{t('replayListGrouped.loading')}</p>;
    if (error) return <p>{t('replayListGrouped.error', { message: error.message })}</p>;

    const groups = Object.entries(groupedReplays);

    return (
        <div style={{ position: 'relative' }}>
            {downloading && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(255,255,255,0.5)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <CircularProgress />
                </div>
            )}
            <div className={styles.replayList} style={downloading ? { filter: 'blur(4px)', pointerEvents: 'none' } : {}}>
                <h1>{t('replayListGrouped.title')}</h1>

                {groups.length === 0 ? (
                    <p className={styles.noReplays}>{t('replayListGrouped.empty')}</p>
                ) : (
                    groups.map(([confName, replays]) => (
                        <div key={confName} className={styles.conferenceGroup}>
                            <h3>{confName}</h3>
                            {replays.map((replay) => {
                                const isDisabled = !replay.isActive;
                                return (
                                    <div
                                        className={styles.replayRow}
                                        key={replay.id}
                                        style={{
                                            opacity: isDisabled ? 0.5 : 1, 
                                            pointerEvents: isDisabled ? 'none' : 'auto',
                                        }}
                                    >
                                        <div className={styles.filename}>{replay.uid}</div>
                                        <div className={styles.date}>
                                            {formatReplayDate(replay.created_at, replay.updated_at)}
                                        </div>
                                        <Button
                                            className={styles.downloadButton}
                                            priority="primary"
                                            disabled={isDisabled}
                                            onClick={async () => {
                                                setDownloading(true);
                                                try {
                                                    await ReplayService.downloadReplay(replay.uid);
                                                } catch (e: any) {
                                                    alert(e.message || t('replayListGrouped.downloadError'));
                                                } finally {
                                                    setDownloading(false);
                                                }
                                            }}
                                        >
                                            {t('replayListGrouped.download')}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReplayListGrouped;
