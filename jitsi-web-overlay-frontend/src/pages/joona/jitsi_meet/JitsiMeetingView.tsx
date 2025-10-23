import React, { useRef } from 'react';
import { useRuntimeConfig } from '../../../config/ConfigProvider';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { handlejibriApitechApi, handleRecordingStatus } from './visio_replay';
import { useNavigate } from 'react-router';
import { checkConferenceEnd, createConference, getParicipantsNumber } from './conference_events';

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

  const { VITE_ENABLE_JIBRI_APITECH_API: enableJibriApitechApi, VITE_JIBRI_APITECH_API_DOMAIN: jibriApitechApiDomain } = useRuntimeConfig();
  const jitsiAPIOptions = (window as any).jitsiAPIOptions;

  const onClose = () => {
    navigate('/feedback', { state: { room: roomName } });
    localStorage.removeItem("roomName");
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
        console.info('[Jitsi] API prête');
        localStorage.setItem("roomName", roomName);

        if (enableJibriApitechApi === "true") { handlejibriApitechApi(jitsiAPIOptions, enableJibriApitechApi ?? "", jibriApitechApiDomain ?? ""); }

        api.on('readyToClose', async () => {
          console.info("La réunion est terminée");
          const data = await getParicipantsNumber(roomName);
          participantCountRef.current = data;
          if (participantCountRef.current === 0) {
            await checkConferenceEnd(roomName);
          }
        });

        api.on('videoConferenceJoined', async (event) => {
          // Récupérer et stocker l'ID du participant local
          const myId = event.id;

          api.on('participantRoleChanged', (event) => {
            if (event.id === myId) {
              myRole.current = event.role;
              handleRecordingStatus(api, roomName, myRole.current, checkVideoInterval.current, checkTimeout.current);
            }


          });

          const data = await getParicipantsNumber(roomName);
          participantCountRef.current = data;
          if (participantCountRef.current === 1 && !conferenceRef.current) {
            const conference = await createConference(roomName);
            conferenceRef.current = conference;
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
