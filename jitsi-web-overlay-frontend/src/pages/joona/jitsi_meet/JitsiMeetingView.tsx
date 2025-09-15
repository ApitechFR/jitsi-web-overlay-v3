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

  const enableJibriApitechApi = import.meta.env.VITE_ENABLE_JIBRI_APITECH_API;
  const jibriApitechApiDomain = import.meta.env.VITE_JIBRI_APITECH_API_DOMAIN;
  const jitsiAPIOptions = (window as any).jitsiAPIOptions;

  const onClose = () => {
    navigate('/');
    window.open('/feedback', '_blank');
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
        handleRecordingStatus(api, roomName, checkVideoInterval.current, checkTimeout.current);
        if (enableJibriApitechApi === "true") { handlejibriApitechApi(jitsiAPIOptions, enableJibriApitechApi, jibriApitechApiDomain); }

        const participantsInfo = api.getParticipantsInfo();
        console.log({ participantsInfo });

      }}
      onReadyToClose={onClose}
    />
  );
};

export default JitsiMeetingView;
