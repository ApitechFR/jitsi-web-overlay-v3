import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { validateconferenceName } from '../../../../utils/conferenceName';
import JitsiMeetWrapper from './JitsiMeetWrapper';

export default function JitsiMeet() {
    const { conferenceName } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (!conferenceName) return;

        if (!validateconferenceName(conferenceName)) {
            navigate('/', {
                replace: true,
                state: { prefillRoomName: conferenceName, invalidRoom: true },
            });
            return;
        }
    }, [conferenceName, navigate]);

    if (!conferenceName || !validateconferenceName(conferenceName)) return null;

    return <JitsiMeetWrapper />;
}
