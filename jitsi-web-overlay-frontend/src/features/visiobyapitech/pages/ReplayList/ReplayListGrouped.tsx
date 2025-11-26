import React, { useEffect, useState } from 'react';
import { useApi, ReplayService } from '@/api';
import styles from './ReplayList.module.css';
import Button from '@codegouvfr/react-dsfr/Button';
import { formatDate } from '@/utils/date';
import type { Replay } from '@/api';


const ReplayListGrouped: React.FC = () => {
    const [groupedReplays, setGroupedReplays] = useState<Record<string, Replay[]>>({});

    const { run: fetchGrouped, loading, error } = useApi(ReplayService.getAll);

    useEffect(() => {
        fetchGrouped()
            .then(setGroupedReplays)
            .catch(() => { });
    }, [fetchGrouped]);

    if (loading) return <p>Chargement...</p>;
    if (error) return <p>Erreur : {error.message}</p>;

    const groups = Object.entries(groupedReplays);

    return (
        <>
            <div className={styles.replayList}>
                <h1>Enregistrements Vidéo par conférence</h1>

                {groups.length === 0 ? (
                    <p className={styles.noReplays}>Aucun replay disponible</p>
                ) : (
                    groups.map(([confName, replays]) => (
                        <div key={confName} className={styles.conferenceGroup}>
                            <h3>{confName}</h3>
                            {replays.map((replay) => (
                                <div className={styles.replayRow} key={replay.id}>
                                    <div className={styles.filename}>{replay.uid}</div>
                                    <div className={styles.date}>{formatDate(replay.updated_at)}</div>
                                    <Button
                                        className={styles.downloadButton}
                                        priority="primary"
                                        onClick={async () => {
                                            try {
                                                await ReplayService.downloadReplay(replay.uid);
                                            } catch (e: any) {
                                                alert(e.message || 'Erreur lors du téléchargement');
                                            }
                                        }}
                                    >
                                        Télécharger
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </>
    );
};

export default ReplayListGrouped;
