import React, { useEffect, useState } from 'react';
import { useAlertModal } from '@/features/visiobyapitech/components/Modals/useAlertModal';
import { ReplayService, useApi } from '@/api';
import styles from './ReplayList.module.css';
import { useParams } from 'react-router-dom';
import Button from '@codegouvfr/react-dsfr/Button';
import type { Replay } from '@/api';
import { formatDate } from '@/utils/date';

const ReplayList: React.FC = () => {
    const [replays, setReplays] = useState<Replay[]>([]);

    const { conference_uid } = useParams<{ conference_uid: string }>();

    const { run: fetchByConf, loading, error } = useApi(ReplayService.getByConferenceUid);


    useEffect(() => {
        if (conference_uid) {
            fetchByConf(conference_uid)
                .then(setReplays)
                .catch(() => { });
        }
    }, [conference_uid, fetchByConf]);

    if (loading) return <p>Chargement...</p>;
    if (error) return <p>Erreur : {error.message}</p>;

    const [showModal, AlertModal] = useAlertModal();

    return (
        <>
            <div className={styles.replayList}>
                <h1>Enregistrements Vidéo</h1>

                {replays.length === 0 ? (
                    <p className={styles.noReplays}>Aucun replay disponible pour cette conférence</p>
                ) : (
                    replays.map((replay) => (
                        <div className={styles.replayRow} key={replay.id}>
                            <div className={styles.filename}>{replay.conference_name}</div>
                            <div className={styles.date}>{formatDate(replay.updated_at)}</div>
                            <Button
                                className={styles.downloadButton}
                                priority="primary"
                                onClick={async () => {
                                    try {
                                        await ReplayService.downloadReplay(replay.uid);
                                    } catch (e: any) {
                                        showModal(e.message || 'Erreur lors du téléchargement');
                                    }
                                }}
                            >
                                Télécharger
                            </Button>
                        </div>
                    ))
                )}
            </div>
            <AlertModal />
        </>
    );
};

export default ReplayList;
