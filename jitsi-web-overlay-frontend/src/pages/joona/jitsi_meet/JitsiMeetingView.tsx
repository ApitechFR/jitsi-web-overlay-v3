import React, { useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { handlejibriApitechApi, handleRecordingStatus } from './visio_replay';
import { useNavigate } from 'react-router';

interface Props {
  domain: string;
  roomName: string;
  jwt?: string;
  displayName?: string;
}

const JitsiMeetingView: React.FC<Props> = ({ domain, roomName, jwt, displayName }) => {

  const checkVideoInterval = useRef<NodeJS.Timeout | null>(null);
  const checkTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const myRole = useRef("");

  const enableJibriApitechApi = import.meta.env.VITE_ENABLE_JIBRI_APITECH_API;
  const jibriApitechApiDomain = import.meta.env.VITE_JIBRI_APITECH_API_DOMAIN;
  const jitsiAPIOptions = (window as any).jitsiAPIOptions;

  const onClose = () => {
    navigate('/');
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


        api.on('videoConferenceJoined', (event) => {
          const myId = event.id;
          console.log('participant id', myId);

          api.on('participantRoleChanged', (event) => {
            console.log('participantRoleChanged:', event);
            if (event.id === myId) {
              myRole.current = event.role;
              console.log('Mon nouveau rôle:', myRole);
              handleRecordingStatus(api, roomName, myRole.current, checkVideoInterval.current, checkTimeout.current);
            }
          })

          const participantsInfo = api.getParticipantsInfo();
          console.log({ participantsInfo });

        });

        
        if (enableJibriApitechApi === "true") { handlejibriApitechApi(jitsiAPIOptions, enableJibriApitechApi, jibriApitechApiDomain); }

      }}
      onReadyToClose={onClose}
    />
  );
};

export default JitsiMeetingView;
