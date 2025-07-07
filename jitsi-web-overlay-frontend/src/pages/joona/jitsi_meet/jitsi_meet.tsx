import { JitsiMeeting } from '@jitsi/react-sdk';
import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { checkConferenceEnd, createConference, fetchStats } from './conferenceEvents';
import { handleRecordingStatus } from './visioReplay';

// import Feedback from '../Feedback/Feedback';

// type JitsiMeetProps = { roomName: string };

export default function JitsiMeet() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(0);
    const { roomName } = useParams();
    const participantCountRef = useRef(0);
    const checkVideoInterval = useRef<NodeJS.Timeout | null>(null);
    const checkTimeout = useRef<NodeJS.Timeout | null>(null);

    const navigate = useNavigate();

    const handleJitsiIFrameRef1 = (iframeRef: HTMLElement) => {
        iframeRef.style.border = '10px solid #3d3d3d';
        iframeRef.style.position = 'absolute';
        iframeRef.style.background = '#3d3d3d';
        iframeRef.style.height = '100%';
        iframeRef.style.width = '100%';
    };

    const onClose = () => {
        setOpen(false);
        navigate('/');
    };


    return (
        <>
            {/* <Feedback
                open={open}
                onClose={onClose}
                value={value}
                setValue={setValue}
                roomName={roomName}
            /> */}
            <JitsiMeeting
                domain={import.meta.env.VITE_JITSI_DOMAIN}

                roomName={roomName ? roomName : ''}
                getIFrameRef={handleJitsiIFrameRef1}
                onApiReady={externalApi => {
                    handleRecordingStatus(externalApi, roomName!, checkVideoInterval.current, checkTimeout.current);

                    externalApi.on('readyToClose', async () => {
                        console.log("La réunion est terminée");

                        const data = await fetchStats();
                        participantCountRef.current = data.participants;
                        console.log("participants from readyToClose : ", participantCountRef.current);
                        if (participantCountRef.current === 0) {
                            await checkConferenceEnd(roomName!);
                        }
                    });

                    externalApi.on('videoConferenceJoined', async () => {
                        const data = await fetchStats();
                        participantCountRef.current = data.participants;
                        console.log("participants from videoConferenceJoined : ", participantCountRef.current);
                        if (participantCountRef.current === 2) {
                            const conference = await createConference(roomName!);
                            console.log("created_by : ", conference.created_by);
                        }

                        const participantsInfo = externalApi.getParticipantsInfo();
                        console.log({ participantsInfo });
                    });

                    //------------------------------------------------------------------------------------
                }}
                onReadyToClose={onClose}
            />
        </>
    );
}
