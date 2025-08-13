import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { validateRoomName } from '../../../utils/roomName';
import JitsiMeetWrapper from './JitsiMeetWrapper';

export default function JitsiMeet() {
    const { roomName } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (!roomName) return;

        if (!validateRoomName(roomName)) {
            navigate('/', {
                replace: true,
                state: { prefillRoomName: roomName, invalidRoom: true },
            });
            return;
        }
    }, [roomName, navigate]);

    if (!roomName || !validateRoomName(roomName)) return null;

    return <JitsiMeetWrapper />;
}
