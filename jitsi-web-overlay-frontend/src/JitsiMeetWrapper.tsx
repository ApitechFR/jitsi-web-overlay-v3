import React from 'react';
import { useParams } from 'react-router-dom';
import JitsiMeet from './pages/Jitsi_meet/Jitsi_meet';

type errorObj = {
  message: string;
  error: {
    status: string;
    stack: string;
  };
};

interface JitsiMeetWrapperProps {
  joinConference: (roomName: string) => void;
  setError: (error: errorObj) => void;
  setRoomName: (roomName: string) => void;
  jwt: string | undefined;
}

function isAlphanumeric(str: string) {
  return /^[a-zA-Z0-9]+$/.test(str);
}

const JitsiMeetWrapper: React.FC<JitsiMeetWrapperProps> = ({
  joinConference,
  setError,
  setRoomName,
  jwt,
}) => {
  const { roomName } = useParams();
  if (roomName && isAlphanumeric(roomName)) {
    return (
      <JitsiMeet
        joinConference={joinConference}
        setError={setError}
        setRoomName={setRoomName}
        jwt={jwt}
      />
    );
  }
  return <></>;
};

export default JitsiMeetWrapper;
