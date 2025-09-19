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

        const checkInterval = setInterval(() => {
          const iframeContainer = document.getElementById("jitsiMeeting-1");

          if (iframeContainer?.children[0]) {
            const iframe: any = iframeContainer.children[0];

            if (iframe.contentWindow.document) {
              clearInterval(checkInterval);
              console.log("Iframe chargée !");
              handleRecordingStatus(iframe, api, roomName, checkVideoInterval.current, checkTimeout.current);
            }
          }
        }, 500);
        // handleRecordingStatus(api, roomName, checkVideoInterval.current, checkTimeout.current);
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

        api.on('videoConferenceJoined', async () => {
          const data = await fetchStats(roomName);
          console.log({ data });
          participantCountRef.current = data;
          console.log("participants from videoConferenceJoined : ", participantCountRef.current);
          if (participantCountRef.current === 2 && !conferenceRef.current) {
            const conference = await createConference(roomName);
            conferenceRef.current = conference;
            console.log("Conférence active : ", conference);
            console.log("created_by : ", conference.created_by);
          }
        });


      }}
      onReadyToClose={onClose}
    />
  );
};

export default JitsiMeetingView;
