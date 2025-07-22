import { JitsiMeeting } from '@jitsi/react-sdk';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './jitsi_meet.module.css';
import jwt_decode from 'jwt-decode';

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

const Jitsi_meet = ({
  setError,
  joinConference,
  setRoomName,
  jwt,
}: JitsiMeetProps) => {
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

  console.log('jwt', jwt);

  const handleReadyToClose = () => {
    navigate('/feedback');
  };

  function roomNameConstraintOk(roomName: string | undefined) {
    // Au moins une lettre, au moins 3 chiffres, longueur >= 10
    const regex =
      /^(?=(?:[a-zA-Z0-9]*[a-zA-Z]))(?=(?:[a-zA-Z0-9]*\d){3})[a-zA-Z0-9]{10,}$/;
    return !!roomName && regex.test(roomName);
  }

  const renderSpinner = () => {
    return (
      <div className={styles.progress}>
        <CircularProgress style={{ height: '300px', width: '300px' }} />
      </div>
    );
  };

  // ...existing code...

  useEffect(() => {
    if (roomName && jwt) {
      if (!roomNameConstraintOk(roomName)) {
        setError({
          message: `Le nom de la conférence ${roomName} n'est pas valide. Merci de respecter la convention de nommage indiquée dans le formulaire.`,
          error: { status: '404', stack: '' },
        });
        navigate('/error');
        return;
      }
      try {
        const decodedToken = jwt_decode(jwt);
        const currentDate = new Date();
        const exp =
          typeof (decodedToken as any).exp === 'number'
            ? (decodedToken as any).exp
            : 0;
        if (
          (decodedToken as any).room === undefined ||
          (decodedToken as any).room !== roomName ||
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
    if (roomName && !roomNameConstraintOk(roomName)) {
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
          joinConference(roomName as string);
        }
      });
    }
  }, [roomName, jwt]);

  return (
    <JitsiMeeting
      domain={import.meta.env.VITE_JITSI_DOMAIN}
      roomName={roomName as string}
      jwt={jwt1 || undefined}
      spinner={renderSpinner}
      onApiReady={externalApi => {
        if (
          typeof (
            window as unknown as {
              setupRenderer?: (api: any, options: object) => void;
            }
          ).setupRenderer === 'function'
        ) {
          (
            window as unknown as {
              setupRenderer: (api: any, options: object) => void;
            }
          ).setupRenderer(externalApi, {});
        }
      }}
      onReadyToClose={handleReadyToClose}
      getIFrameRef={handleJitsiIFrameRef1}
    />
  );
};

export default Jitsi_meet;
