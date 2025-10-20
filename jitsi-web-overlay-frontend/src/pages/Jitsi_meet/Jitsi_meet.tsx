import { validateRoomName } from '../../utils/roomName';
import { JitsiMeeting } from '@jitsi/react-sdk';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './jitsi_meet.module.css';
import jwt_decode from 'jwt-decode';
import { useRuntimeConfig } from '../../config/ConfigProvider';

import api from '../../axios/axios';

type errorObj = {
  message: string;
  error: {
    status: string;
    stack: string;
  };
};

interface JitsiMeetProps {
  setError: (e: errorObj) => void;
  joinConference: (e: string) => void;
  setRoomName: (e: string) => void;
  jwt: string | undefined;
}

interface DecodedJwt {
  exp: number;
  room?: string;
  [key: string]: unknown;
}

interface WindowWithSetupRenderer extends Window {
  setupRenderer?: (api: unknown, options: object) => void;
}

const Jitsi_meet = ({
  setError,
  joinConference,
  setRoomName,
  jwt,
}: JitsiMeetProps) => {
  const { VITE_JITSI_DOMAIN } = useRuntimeConfig();
  const navigate = useNavigate();
  const { roomName } = useParams();
  const jwt1 = jwt || window.location.search.split('=')[1];

  const handleJitsiIFrameRef1 = (parentNode: HTMLDivElement) => {
    const iframe = parentNode.querySelector('iframe');
    if (iframe) {
      iframe.style.border = '10px solid #3d3d3d';
      iframe.style.position = 'absolute';
      iframe.style.background = '#3d3d3d';
      iframe.style.height = '100%';
      iframe.style.width = '100%';
    }
  };

  const handleReadyToClose = () => {
    navigate('/feedback');
  };

  const renderSpinner = () => {
    return (
      <div className={styles.progress}>
        <CircularProgress style={{ height: '300px', width: '300px' }} />
      </div>
    );
  };

  useEffect(() => {
    if (roomName && jwt) {
      if (!validateRoomName(roomName)) {
        setError({
          message: `Le nom de la conférence ${roomName} n'est pas valide. Merci de respecter la convention de nommage indiquée dans le formulaire.`,
          error: { status: '404', stack: '' },
        });
        navigate('/error');
        return;
      }
      try {
        const decodedToken = jwt_decode<DecodedJwt>(jwt);
        const currentDate = new Date();
        const exp = typeof decodedToken.exp === 'number' ? decodedToken.exp : 0;
        if (
          decodedToken.room === undefined ||
          decodedToken.room !== roomName ||
          exp * 1000 < currentDate.getTime()
        ) {
          setError({
            message:
              "le jwt est expiré ou le nom de la conférence n'est pas valide",
            error: { status: '404', stack: '' },
          });
          navigate('/error');
        }
      } catch {
        setError({
          message: "le jwt n'est pas valid",
          error: { status: '404', stack: '' },
        });
        navigate('/error');
      }
      return;
    }
    if (roomName === 'error') {
      navigate('/error');
      return;
    }
    if (roomName && !validateRoomName(roomName)) {
      setRoomName(roomName);
      setError({
        message: `Le nom de la conférence ${roomName} n'est pas valide. Merci de respecter la convention de nommage indiquée dans le formulaire.`,
        error: { status: '404', stack: '' },
      });
      navigate('/error');
      return;
    }
    if (roomName) {
      api.get(`/${roomName}`).then(res => {
        if (res.data.error || res.data.login) {
          return navigate('/error');
        }
        if (res.data.jwt) {
          joinConference(roomName);
        }
      });
    }
  }, [roomName, jwt, joinConference, navigate, setError, setRoomName]);

  return (
    <JitsiMeeting
      domain={VITE_JITSI_DOMAIN}
      roomName={roomName ?? ''}
      jwt={jwt1 || undefined}
      spinner={renderSpinner}
      onApiReady={(externalApi: unknown) => {
        const win = window as WindowWithSetupRenderer;
        if (typeof win.setupRenderer === 'function') {
          win.setupRenderer(externalApi, {});
        }
      }}
      onReadyToClose={handleReadyToClose}
      getIFrameRef={handleJitsiIFrameRef1}
    />
  );
};

export default Jitsi_meet;
