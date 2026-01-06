import { useState } from 'react';
import { ConferenceService } from '@/api/services/conference/conference.service';
import { WebinarService } from '@/api/services/webinar/webinar.service';

interface WebinarInvitationProps {
    roomName: string;
}

export function WebinarInvitation({ roomName }: WebinarInvitationProps) {
    const [invitationToken, setInvitationToken] = useState<string | null>(null);
    const [visitorLink, setVisitorLink] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateInvitation = async () => {
        setLoading(true);
        setError(null);
        try {
            // Appelle l'API pour obtenir un token d'invitation court
            const res = await ConferenceService.jitsiVisitorJwt(roomName);
            const invitationToken = (res as any).invitationToken || res.token;
            if (!res || !invitationToken) throw new Error('Aucun token invitation reçu');
            setInvitationToken(invitationToken);
            // Génère le lien frontend à partager
            setVisitorLink(`${window.location.origin}/webinar/invite/${invitationToken}`);
        } catch (e: any) {
            setError(e.message || 'Erreur lors de la génération du lien');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={handleGenerateInvitation} disabled={loading}>
                Générer un lien spectateur (webinaire)
            </button>
            {loading && <span>Génération en cours...</span>}
            {error && <span style={{ color: 'red' }}>{error}</span>}
            {visitorLink && (
                <div>
                    <input type="text" value={visitorLink} readOnly style={{ width: '80%' }} />
                    <button onClick={() => navigator.clipboard.writeText(visitorLink)}>Copier</button>
                </div>
            )}
        </div>
    );
}
