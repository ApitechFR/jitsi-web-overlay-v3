import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { ReplayService, useApi } from '@/api';
import styles from './ReplayList.module.css';
import { useParams } from 'react-router-dom';
import Button from '@codegouvfr/react-dsfr/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { Replay } from '@/api';
import { formatReplayDate } from '@/utils/date';

const ReplayList: React.FC = () => {
    const { t } = useTranslation();
    const [replays, setReplays] = useState<Replay[]>([]);
    const [downloading, setDownloading] = useState(false);

    const { conference_uid } = useParams<{ conference_uid: string }>();

    const { run: fetchByConf, loading, error } = useApi(ReplayService.getByConferenceUid);


    useEffect(() => {
        if (conference_uid) {
            fetchByConf(conference_uid)
                .then(setReplays)
                .catch(() => { });
        }
    }, [conference_uid, fetchByConf]);

    if (loading) return <p>{t('replayList.loading')}</p>;
    if (error) return <p>{t('replayList.error')}: {error.message}</p>;

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
                <h1>{t('replayList.title')}</h1>

                {replays.length === 0 ? (
                    <p className={styles.noReplays}>{t('replayList.none')}</p>
                ) : (
                    replays.map((replay) => (
                        <div className={styles.replayRow} key={replay.id}>
                            <div className={styles.filename}>{replay.conference_name}</div>
                            <div className={styles.date}>{formatReplayDate(replay.created_at, replay.updated_at)}</div>
                            <Button
                                className={styles.downloadButton}
                                priority="primary"
                                onClick={async () => {
                                    setDownloading(true);
                                    try {
                                        await ReplayService.downloadReplay(replay.uid);
                                    } catch (e: any) {
                                        alert(e.message || t('replayList.downloadError'));
                                    } finally {
                                        setDownloading(false);
                                    }
                                }}
                            >
                                {t('replayList.download')}
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReplayList;
