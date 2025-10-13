import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { validateconferenceName } from '../../../utils/conferenceName';
import JitsiMeetWrapper from './JitsiMeetWrapper';

export default function JitsiMeet() {
    const { roomName } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (!roomName) return;

        if (!validateconferenceName(roomName)) {
            navigate('/', {
                replace: true,
                state: { prefillRoomName: roomName, invalidRoom: true },
            });
            return;
        }
    }, [roomName, navigate]);

    if (!roomName || !validateconferenceName(roomName)) return null;

    return <JitsiMeetWrapper />;
}
