import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../jitsi_meet/visio_replay';
import styles from './ReplayList.module.css';
import { useSearchParams } from 'react-router-dom';
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

const ReplayList: React.FC = () => {
    const [replays, setReplays] = useState<Replay[]>([]);
    const [searchParams] = useSearchParams();
    const conference_uid = searchParams.get('room');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get<Replay[]>(`${API_BASE_URL}/replays/conference/${conference_uid}`)
            .then((res) => setReplays(res.data))
            .catch((err) => console.error('Erreur :', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Chargement...</p>;

    return (

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
                            onClick={() => {
                                window.open(
                                    `${API_BASE_URL}/replays/download?path=${encodeURIComponent(replay.file_path)}`,
                                    '_blank',
                                    'noopener,noreferrer'
                                );
                            }}
                        >
                            Télécharger
                        </Button>
                    </div>
                ))
            )}
        </div>
    );

};

export default ReplayList;
