import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

interface Props {
  domain: string;
  roomName: string;
  jwt?: string;
  displayName?: string;
}

const JitsiMeetingView: React.FC<Props> = ({ domain, roomName, jwt, displayName }) => {
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
        
      }}
    />
  );
};

export default JitsiMeetingView;
