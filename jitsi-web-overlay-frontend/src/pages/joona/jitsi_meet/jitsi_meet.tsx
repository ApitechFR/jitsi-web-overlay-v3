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


    const enableJibriApitechApi = import.meta.env.VITE_ENABLE_JIBRI_APITECH_API;
    const jibriApitechApiDomain = import.meta.env.VITE_JIBRI_APITECH_API_DOMAIN;
    const jitsiAPIOptions = (window as any).jitsiAPIOptions;

    //jitsiAPIOptions ???
    // const jitsiAPIOptions = {
    //     eventId: '12345',
    //     roomName: roomName ?? '',
    //     uploadCallbackJwt: 'jwt',
    //     uploadCallbackUrl: 'https://api',
    //     uploadCallbackDomainUrl: 'https://api',
    // };

    const handlejibriApitechApi = () => {
        console.log(`enableJibriApitechApi=${enableJibriApitechApi}`);
        console.log(`jibriApitechApiDomain=${jibriApitechApiDomain}`);

        if (
            enableJibriApitechApi &&
            enableJibriApitechApi !== "process.env.ENABLE_JIBRI_APITECH_API" &&
            jibriApitechApiDomain &&
            jibriApitechApiDomain !== "process.env.JIBRI_APITECH_API_DOMAIN"
        ) {

			let eventId = jitsiAPIOptions.eventId;
			let roomName = jitsiAPIOptions.roomName;
			let uploadCallbackJwt = jitsiAPIOptions.uploadCallbackJwt;
			let uploadCallbackUrl = jitsiAPIOptions.uploadCallbackUrl;
			let uploadCallbackDomainUrl = jitsiAPIOptions.uploadCallbackDomainUrl;

            if (!eventId || !roomName || !uploadCallbackJwt) {
                console.warn("Certains paramètres pour register_eventid sont manquants.");
                return;
            }

            const jibriUrl = `${jibriApitechApiDomain}/visioreplay/register_eventid/${roomName}?eventid=${eventId}&jwt=${uploadCallbackJwt}&uploadcallbackdomainurl=${uploadCallbackDomainUrl}&uploadcallbackurl=${uploadCallbackUrl}`;

            // const xmlHttp = new XMLHttpRequest();
            // xmlHttp.onreadystatechange = function () {
            //     if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            //         console.log("Jibri API Response:", xmlHttp.responseText);
            //     }
            // };
            // xmlHttp.open("GET", jibriUrl, true);
            // xmlHttp.send(null);

            fetch(jibriUrl)
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! Status: ${res.status}`);
                    }
                    return res.text();
                })
                .then((text) => {
                    console.log("Jibri API Response:", text);
                })
                .catch((err) => {
                    console.error("Erreur API Jibri :", err);
                });
        }
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
                    handlejibriApitechApi();
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