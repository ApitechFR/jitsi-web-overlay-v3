import React, { useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { handlejibriApitechApi, handleRecordingStatus } from './visio_replay';
import { useNavigate } from 'react-router';
import { checkConferenceEnd, createConference, fetchStats } from './conference_events';

interface Props {
  domain: string;
  roomName: string;
  jwt?: string;
  displayName?: string;
}

const JitsiMeetingView: React.FC<Props> = ({ domain, roomName, jwt, displayName }) => {

  const participantCountRef = useRef(0);
  const conferenceRef = useRef(null);
  const checkVideoInterval = useRef<NodeJS.Timeout | null>(null);
  const checkTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const myRole = useRef("");

  const enableJibriApitechApi = import.meta.env.VITE_ENABLE_JIBRI_APITECH_API;
  const jibriApitechApiDomain = import.meta.env.VITE_JIBRI_APITECH_API_DOMAIN;
  const jitsiAPIOptions = (window as any).jitsiAPIOptions;

  const onClose = () => {
    navigate('/feedback');
  };

  return (
    <JitsiMeeting
      domain={domain}
      roomName={roomName}
      jwt={jwt}
      userInfo={{
        displayName: displayName ?? "Display Name",
        email: '',
      }}
      configOverwrite={{
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        prejoinConfig: { enabled: true },
      }}
      interfaceConfigOverwrite={{
        //  customiser ici l'interface 
      }}
      getIFrameRef={(iframeRef) => {
        iframeRef.style.height = '100vh';
        iframeRef.style.width = '100%';
      }}
      onApiReady={(api) => {
        console.log('[Jitsi] API prête');

        if (enableJibriApitechApi === "true") { handlejibriApitechApi(jitsiAPIOptions, enableJibriApitechApi, jibriApitechApiDomain); }

        api.on('readyToClose', async () => {
          console.log("La réunion est terminée");
          const data = await fetchStats(roomName);
          participantCountRef.current = data;
          console.log("participants from readyToClose : ", participantCountRef.current);
          if (participantCountRef.current === 0) {
            await checkConferenceEnd(roomName);
          }
        });

        api.on('videoConferenceJoined', async (event) => {
          // Récupérer et stocker l'ID du participant local
          const myId = event.id;
          console.log('participant id', myId);

          api.on('participantRoleChanged', (event) => {
            console.log('participantRoleChanged:', event);
            if (event.id === myId) {
              myRole.current = event.role;
              console.log('Mon nouveau rôle:', myRole);
            }

            handleRecordingStatus(api, roomName, myRole.current, checkVideoInterval.current, checkTimeout.current);
          });
          
          const data = await fetchStats(roomName);
          console.log({ data });
          participantCountRef.current = data;
          console.log("participants from videoConferenceJoined : ", participantCountRef.current);
          if (participantCountRef.current === 1 && !conferenceRef.current) {
            const conference = await createConference(roomName);
            conferenceRef.current = conference;
            console.log("Conférence active : ", conference);
            console.log("created_by : ", conference.created_by);
          }

          // api.getRoomsInfo().then((rooms : any) => {
          //   const roomsArray: any = Object.values(rooms);
          //   console.log('Rooms info:', roomsArray[0].participants);
            
          // })

        });


      }}
      onReadyToClose={onClose}
    />
  );
};

export default JitsiMeetingView;
