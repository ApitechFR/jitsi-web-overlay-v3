
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { WebinarService } from '@/api/services/webinar/webinar.service';
import CircularProgress from '@mui/material/CircularProgress';
import JitsiMeetWrapper from '../Jitsi_meet/JitsiMeetWrapper';

export default function WebinarInvitePage() {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [jwt, setJwt] = useState<string | null>(null);
    const [roomName, setRoomName] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError('Lien d’invitation invalide.');
            setLoading(false);
            return;
        }
        WebinarService.getInvitation(token)
            .then(({ roomName, jwt }) => {
                setRoomName(roomName);
                setJwt(jwt);
                setLoading(false);
            })
            .catch((e) => {
                setError(e.message || 'Lien d’invitation expiré ou invalide.');
                setLoading(false);
            });
    }, [token]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress style={{ height: '150px', width: '150px' }} />
        </div>
    );
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (!roomName || !jwt) return null;

    // Use JitsiMeetWrapper with props for harmonized experience
    return (
        <JitsiMeetWrapper
            conferenceName={roomName}
            jwt={jwt}
            displayName={"Spectateur"}
            user={undefined}
            isWebinarInvite={true}
        />
    );
}
