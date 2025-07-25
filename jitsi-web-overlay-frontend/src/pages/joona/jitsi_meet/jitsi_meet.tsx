import { JitsiMeeting } from '@jitsi/react-sdk';
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { logDebug } from '../../../utils/logDebug';
// import Feedback from '../Feedback/Feedback';

// type JitsiMeetProps = { roomName: string };

export default function JitsiMeet() {
  const { roomName } = useParams();

  const navigate = useNavigate();

  const handleJitsiIFrameRef1 = (iframeRef: HTMLElement) => {
    iframeRef.style.border = '10px solid #3d3d3d';
    iframeRef.style.position = 'absolute';
    iframeRef.style.background = '#3d3d3d';
    iframeRef.style.height = '100%';
    iframeRef.style.width = '100%';
  };

  const onClose = () => {
    navigate('/');
  };

  //visioreplay------------------------------------------------
  const API_BASE_URL = import.meta.env.VITE_BASE_URL;
  const checkVideoInterval = useRef<NodeJS.Timeout | null>(null);
  const checkTimeout = useRef<NodeJS.Timeout | null>(null);

  const showLoadingToast = (message: string) => {
    Swal.fire({
      title: message,
      showCloseButton: true,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  };

  const startVideo = async () => {
    const conference_name = roomName;

    const status = 'started';
    const message = "Utilisateur commence l'enregistrement";

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/visioreplay/start_recording`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status, message, conference_name }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        logDebug('Erreur :', errorData);
      }
    } catch (error) {
      logDebug('Erreur :', error);
    }
  };

  const checkVideo = async () => {
    if (!roomName) return;
    const conference_name = roomName;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/visioreplay/findReplay/${encodeURIComponent(
          conference_name
        )}`
      );
      const data = await response.json();

      if (data === 'terminated') {
        Swal.fire({
          title: 'Succès !',
          text: `La vidéo pour "${conference_name}" a été enregistrée avec succès.`,
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          showCloseButton: true,
        });

        if (checkVideoInterval.current)
          clearInterval(checkVideoInterval.current);
        if (checkTimeout.current) clearTimeout(checkTimeout.current);
        checkVideoInterval.current = null;
        checkTimeout.current = null;
      } else if (data === 'error-uploading-rsync') {
        Swal.fire({
          title: 'Erreur !',
          text: `Une erreur est survenue lors de l'enregistrement de la vidéo pour "${conference_name}". Veuillez contacter le support.`,
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          showCloseButton: true,
        });

        if (checkVideoInterval.current)
          clearInterval(checkVideoInterval.current);
        if (checkTimeout.current) clearTimeout(checkTimeout.current);
        checkVideoInterval.current = null;
        checkTimeout.current = null;
      }
    } catch (error) {
      logDebug('Erreur lors de la vérification du replay :', error);
    }
  };

  interface RecordingStatusEvent {
    on: boolean;
    error?: string;
    [key: string]: unknown;
  }

  const handleRecordingStatus = (api: unknown) => {
    let isRecordingStarted = false;

    // On vérifie que l'API a bien la méthode attendue
    if (
      typeof api === 'object' &&
      api !== null &&
      'addEventListener' in api &&
      typeof (
        api as {
          addEventListener: (
            event: string,
            cb: (event: RecordingStatusEvent) => void
          ) => void;
        }
      ).addEventListener === 'function'
    ) {
      (
        api as {
          addEventListener: (
            event: string,
            cb: (event: RecordingStatusEvent) => void
          ) => void;
        }
      ).addEventListener(
        'recordingStatusChanged',
        (event: RecordingStatusEvent) => {
          const isRecordingOn = event.on;
          const error = event.error;

          if (isRecordingOn) {
            isRecordingStarted = true;
            startVideo();
          } else if (error) {
            // rien à faire, on ignore l'erreur ici
          } else if (isRecordingStarted) {
            showLoadingToast("Upload de l'enregistrement en cours ...");

            if (!checkVideoInterval.current) {
              checkVideoInterval.current = setInterval(() => {
                checkVideo();
              }, 1000);

              checkTimeout.current = setTimeout(() => {
                clearInterval(checkVideoInterval.current as NodeJS.Timeout);
                checkVideoInterval.current = null;
                checkTimeout.current = null;
                Swal.fire({
                  title: 'Erreur !',
                  text: `Une erreur est survenue lors de l'enregistrement de la vidéo. Veuillez contacter le support.`,
                  icon: 'error',
                  toast: true,
                  position: 'top-end',
                  showConfirmButton: false,
                  showCloseButton: true,
                });
              }, 600000); // 10 min
            }
          }
        }
      );
    }
  };
  //----------------------------------------------------------

  return (
    <>
      {/* <Feedback
                open={open}
                onClose={onClose}
                value={value}
                setValue={setValue}
                roomName={roomName}
            /> */}
      <JitsiMeeting
        domain={import.meta.env.VITE_JITSI_DOMAIN}
        roomName={roomName ?? ''}
        getIFrameRef={handleJitsiIFrameRef1}
        onApiReady={externalApi => {
          handleRecordingStatus(externalApi);
        }}
        onReadyToClose={onClose}
      />
    </>
  );
}
