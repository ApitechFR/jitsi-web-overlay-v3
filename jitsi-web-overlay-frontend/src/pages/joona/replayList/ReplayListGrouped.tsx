import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRuntimeConfig } from '../../../config/ConfigProvider';

import styles from './ReplayList.module.css';
import Button from '@codegouvfr/react-dsfr/Button';

interface Replay {
    id: number;
    uid: string;
    file_path: string;
    status: string;
    message: string;
    conference_name: string;
    created_at: string;
    updated_at: string;
}

const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(date);
};


const ReplayListGrouped: React.FC = () => {
    const [groupedReplays, setGroupedReplays] = useState<Record<string, Replay[]>>({});
    const [loading, setLoading] = useState(true);
    const { VITE_API_URL: API_BASE_URL } = useRuntimeConfig();

    useEffect(() => {
        axios.get(`${API_BASE_URL}/replays`)
            .then((res) => setGroupedReplays(res.data))
            .catch((err) => console.error('Erreur :', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Chargement...</p>;

    return (
        <div className={styles.replayList}>
            <h1>Enregistrements vidéo par conférence</h1>
            {Object.keys(groupedReplays).length === 0 ? (
                <p className={styles.noReplays}>Aucun enregistrement disponible</p>
            ) : (
                Object.entries(groupedReplays).map(([confName, replays]) => (
                    <div key={confName} className={styles.conferenceGroup}>
                        <h3>{confName}</h3>
                        {replays.map((replay) => (
                            <div className={styles.replayRow} key={replay.id}>
                                <div className={styles.filename}>{replay.uid}</div>
                                <div className={styles.date}>{formatDate(replay.updated_at)}</div>
                                <Button
                                    className={styles.downloadButton}
                                    priority="primary"
                                    onClick={() => {
                                        window.open(
                                            `${API_BASE_URL}/replays/download/${encodeURIComponent(replay.uid)}`,
                                            '_blank',
                                            'noopener,noreferrer'
                                        );
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
    );
};

export default ReplayListGrouped;
