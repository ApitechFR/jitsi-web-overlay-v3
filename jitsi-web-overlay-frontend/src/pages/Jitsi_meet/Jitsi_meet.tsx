import { JitsiMeeting } from '@jitsi/react-sdk';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './jitsi_meet.module.css';
import jwt_decode from 'jwt-decode';
import { ReactNode } from 'react';
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
  setMsg: (e: ReactNode) => void;
  setRoomName: (e: string) => void;
  jwt: any;
}

const Jitsi_meet = ({
  setError,
  joinConference,
  setMsg,
  setRoomName,
  jwt,
}: JitsiMeetProps) => {
  const navigate = useNavigate();
  const { roomName } = useParams();
  const jwt1 = jwt ? jwt : window.location.search.split('=')[1];

  const handleJitsiIFrameRef1 = (iframeRef: any) => {
    iframeRef.style.border = '10px solid #3d3d3d';
    iframeRef.style.position = 'absolute';
    iframeRef.style.background = '#3d3d3d';
    iframeRef.style.height = '100%';
    iframeRef.style.width = '100%';
  };

  console.log('jwt', jwt);

  const handleReadyToClose = () => {
    navigate('/feedback');
  };

  function roomNameConstraintOk(roomName: string | undefined) {
    /**
     * Verify if the room name is valid
     * @param {String} roomName The room name
     * @return {Boolean}        True if the room name is valid, false otherwise
     */
    const regex = new RegExp(
      '^(?=(?:[a-zA-Z0-9]*[a-zA-Z]))(?=(?:[a-zA-Z0-9]*[0-9]){3})[a-zA-Z0-9]{10,}$'
    );
    return regex.test(roomName as string);
  }

  const renderSpinner = () => {
    return (
      <div className={styles.progress}>
        <CircularProgress style={{ height: '300px', width: '300px' }} />
      </div>
    );
  };

  let decodedToken: any;

  useEffect(() => {
    if (roomName && jwt) {
      if (!roomNameConstraintOk(roomName)) {
        setError({
          message: `Le nom de la conférence ${roomName} n'est pas valide. Merci de respecter la convention de nommage indiquée dans le formulaire.`,
          error: { status: '404', stack: '' },
        });
        navigate('/error');
      }

      try {
        decodedToken = jwt_decode(jwt);
        const currentDate = new Date();
        if (
          decodedToken.room === undefined ||
          decodedToken.room !== roomName ||
          decodedToken.exp * 1000 < currentDate.getTime()
        ) {
          setError({
            message:
              "le jwt est expiré ou le nom de la conférence n'est pas valide",
            error: { status: '404', stack: '' },
          });
          navigate('/error');
        }
      } catch (error) {
        setError({
          message: "le jwt n'est pas valid",
          error: { status: '404', stack: '' },
        });
        navigate('/error');
      }
    } else {
      if (roomName === 'error') {
        navigate('/error');
      }
      if (roomName && !roomNameConstraintOk(roomName)) {
        setRoomName(roomName);
        setError({
          message: `Le nom de la conférence ${roomName} n'est pas valide. Merci de respecter la convention de nommage indiquée dans le formulaire.`,
          error: { status: '404', stack: '' },
        });
        navigate('/error');
      } else {
        api.get(`/${roomName}`).then(res => {
          if (res.data.error || res.data.login) {
            return navigate('/error');
          }
          if (res.data.jwt) {
            joinConference(roomName as string);
          }
        });
      }
    }
  }, [roomName]);

  return (
    <>
      <JitsiMeeting
        domain={import.meta.env.VITE_JITSI_DOMAIN}
        roomName={roomName as string}
        jwt={jwt1 ? jwt1 : undefined}
        spinner={renderSpinner}
        // config={{
        //   hideConferenceSubject: false,
        // }}
        onApiReady={externalApi => {
          if (typeof (window as any).setupRenderer === 'function') {
            (window as any).setupRenderer(externalApi, {});
          }
          //handleApiReady(externalApi);
        }}
        onReadyToClose={handleReadyToClose}
        getIFrameRef={handleJitsiIFrameRef1}
      />
    </>
  );
};

export default Jitsi_meet;
