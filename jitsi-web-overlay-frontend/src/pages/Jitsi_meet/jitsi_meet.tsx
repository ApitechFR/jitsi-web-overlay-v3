import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { validateConferenceName } from '@/utils/conferenceName';
import JitsiMeetWrapper from './JitsiMeetWrapper';

export default function JitsiMeet() {
    const { conferenceName } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (!conferenceName) return;

        if (!validateConferenceName(conferenceName).isValidConfName) {
            navigate('/', {
                replace: true,
                state: { prefillRoomName: conferenceName, invalidRoom: true },
            });
            return;
        }
    }, [conferenceName, navigate]);

    if (!conferenceName || !validateConferenceName(conferenceName).isValidConfName) return null;

    return <JitsiMeetWrapper />;
}
