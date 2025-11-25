import React, {
  useState,
  useEffect,
  useCallback,
  ReactNode,
  SyntheticEvent,
} from 'react';
import styles from './BrowserTestJoona.module.css';
import Button from '@mui/material/Button';
// import { ReactMic } from 'react-mic';
import { ReactMediaRecorder } from 'react-media-recorder';
import Webcam from 'react-webcam';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import api from '../../../../axios/axios';
import CircularProgress from '@mui/material/CircularProgress';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useNavigate } from 'react-router-dom';
import { Alert } from '@apitechfr/react-dsapitech/Alert';
import { useRuntimeConfig } from '../../../../config/ConfigProvider';

export default function BrowserTestJoona() {
  const [expanded, setExpanded] = React.useState<string | boolean>('');
  const [mic, setMic] = React.useState('');
  const [cam, setCam] = React.useState('');
  const [micItems, setMicItems] = React.useState<MediaDeviceInfo[]>([]);
  const [camItems, setCamItems] = React.useState<MediaDeviceInfo[]>([]);
  const [navTest, setNavTest] = useState<boolean | null>();
  const [micTest, setMicTest] = useState<boolean | null>();
  const [camTest, setCamTest] = useState<boolean | null>();
  const [record, setRecord] = useState(false);
  const [errorMessage, setErrorMessage] = useState<ReactNode | null>(<></>);
  const [confTest, setConfTest] = useState<boolean | null>(null);
  const webcamRef = React.useRef<any>(null);
  const mediaRecorderRef = React.useRef<any>();
  const [capturing, setCapturing] = React.useState(false);
  const [recordedChunks, setRecordedChunks] = React.useState([]);
  const [conference, setConference] = useState(getRandomConfName());
  const [jwt, setJwt] = useState<string | undefined>();
  const [matches, setMatches] = useState<boolean>(
    window.matchMedia('(min-width: 600px)').matches
  );
  const [loading, setLoading] = useState<boolean>();

  const navigate = useNavigate();
  const cfg = useRuntimeConfig();

  useEffect(() => {
    window
      .matchMedia('(min-width: 768px)')
      .addEventListener('change', e => setMatches(e.matches));
  }, []);

  function getRandomConfName() {
    function makeid(length: number) {
      let result = '';
      const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      for (let i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    }
    return 'browsertest123' + makeid(16);
  }

  useEffect(() => {
    setLoading(true);
    api.get(`/${conference}`).then(res => {
      if (res.data.error) {
        navigate('/error');
      } else {
        if (res.data.jwt) {
          setJwt(res.data.jwt);
          setLoading(false);
        }
      }
    });
  }, [conference]);

  const handleChange =
    (panel: string) => (event: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : '');
    };

  const handleStartCaptureClick = React.useCallback(() => {
    setCamTest(null);
    navigator.mediaDevices
      .getUserMedia({ video: { deviceId: cam }, audio: false })
      .then((mediaStream: MediaStream) => {
        // webcamRef.current = mediaStream;
        setErrorMessage(null);
        setCapturing(true);
        mediaRecorderRef.current = new MediaRecorder(mediaStream, {
          mimeType: 'video/webm',
        });
        mediaRecorderRef.current.addEventListener(
          'dataavailable',
          handleDataAvailable
        );
        mediaRecorderRef.current.start();

        setTimeout(
          () =>
            mediaStream.getTracks().forEach(function (track) {
              track.stop();
            }),
          2500
        );
      })
      .catch((err: Error) => {
        setCamTest(false);
        setErrorMessage(
          <Alert
            closable
            description="Veuillez autoriser le navigateur à utiliser la caméra."
            onClose={function noRefCheck() {
              return;
            }}
            small
            title="Information"
            severity="error"
          />
        );
      });
  }, [webcamRef, setCapturing, mediaRecorderRef, cam]);

  const handleDataAvailable = React.useCallback(
    ({ data }: any) => {
      if (data.size > 0) {
        setRecordedChunks(prev => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const handleStopCaptureClick = React.useCallback(() => {
    mediaRecorderRef.current.stop();
    setCapturing(false);
    navigator.mediaDevices
      .getUserMedia({ video: { deviceId: cam }, audio: false })
      .then(mediaStream => {
        setErrorMessage(null);
        const stream = mediaStream;
        // const tracks = stream.getTracks();
        // tracks[0].stop();
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
      })
      .catch(err => {
        setCamTest(false);
        setErrorMessage(
          <Alert
            closable
            description="Veuillez autoriser le navigateur à utiliser la caméra."
            onClose={function noRefCheck() {
              return;
            }}
            small
            title="Information"
            severity="error"
          />
        );
      });
  }, [mediaRecorderRef, webcamRef, setCapturing]);

  useEffect(() => {
    if (!capturing && recordedChunks.length > 0) {
      setCamTest(true);
    } else {
      setCamTest(null);
    }
  }, [capturing, recordedChunks]);

  const startRecording = useCallback(() => {
    setMicTest(state => null);
    const constraints = { deviceId: { exact: mic } };
    navigator.mediaDevices
      .getUserMedia({ audio: constraints })
      .then(stream => {
        // Code for success
        setErrorMessage(null);
        setRecord(true);
      })
      .catch(err => {
        setMicTest(false);
        setErrorMessage(
          <Alert
            closable
            description="Veuillez autoriser le navigateur à utiliser le microphone."
            onClose={function noRefCheck() {
              return;
            }}
            small
            title="Information"
            severity="error"
          />
        );
      });
  }, [mic]);

  const stopRecording = () => {
    const constraints = { deviceId: { exact: mic } };
    navigator.mediaDevices
      .getUserMedia({ audio: constraints })
      .then(stream => {
        // Code for success
        setErrorMessage(null);
        setRecord(false);
        setMicTest(true);
      })
      .catch(err => {
        setMicTest(false);
        setErrorMessage(
          <Alert
            closable
            description="Veuillez autoriser le navigateur à utiliser le microphone."
            onClose={function noRefCheck() {
              return;
            }}
            small
            title="Information"
            severity="error"
          />
        );
      });
  };

  const onData = (recordedBlob: Blob) => {
    return;
  };

  const onStop = (recordedBlob: Blob) => {
    return;
  };

  const handleStartConference = () => {
    setConfTest(true);
  };

  const handleStopConference = () => {
    setConfTest(false);
  };

  const launchTest = async () => {
    setExpanded(false);
    setNavTest(null);
    setMicTest(null);
    setCamTest(null);
    setConfTest(null);
    setLoading(true);
    const isChromium = navigator.userAgent.includes('Chrome');

    setTimeout(() => {
      setNavTest(navTest => isChromium);
      setExpanded('panel1');
    }, 200);

    await navigator.mediaDevices
      .getUserMedia({ audio: { deviceId: mic } })
      .then(stream => {
        // Code for success
        setErrorMessage(null);
        setExpanded('panel2');
        startRecording();
        setTimeout(() => {
          stopRecording();
          setMicTest(true);
          setExpanded('');
        }, 3000);
      })
      .catch(err => {
        setMicTest(false);
        setErrorMessage(
          <Alert
            closable
            description="Veuillez autoriser le navigateur à utiliser le microphone."
            onClose={function noRefCheck() {
              return;
            }}
            small
            title="Information"
            severity="error"
          />
        );
      });

    setTimeout(() => {
      setExpanded('panel3');
      handleStartCaptureClick();
    }, 3500);
    setTimeout(() => {
      handleStopCaptureClick();
      setExpanded('');
      setTimeout(() => {
        setExpanded('panel4');
      }, 500);
    }, 8500);
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => {
        navigator.mediaDevices
          .enumerateDevices()
          .then(function (devices) {
            const audio = devices.filter(
              device => device.kind === 'audioinput'
            );
            const video = devices.filter(
              device => device.kind === 'videoinput'
            );
            setCamItems(video);
            setMicItems(audio);
            setCam(video[0].deviceId);
            setMic(audio[0].deviceId);
          })
          .then(() => {
            stream.getTracks().forEach(function (track) {
              track.stop();
            });
          })
          .catch(function (err) {
            return err;
          });
        return stream;
      })
      .then(stream => {
        return;
      })
      .catch(err => {
        navigator.mediaDevices
          .enumerateDevices()
          .then(function (devices) {
            const audio = devices.filter(
              device => device.kind === 'audioinput'
            );
            const video = devices.filter(
              device => device.kind === 'videoinput'
            );
            setCamItems(video);
            setMicItems(audio);
            setCam(video[0].deviceId);
            setMic(audio[0].deviceId);
          })
          .catch(function (err) {
            return err;
          });
      });
  }, [mic, cam]);

  type Event = {
    target: {
      value: any;
    };
  };

  const handleMicChange = (event: Event) => {
    const constraints = { deviceId: { exact: event.target.value } };
    navigator.mediaDevices.getUserMedia({ audio: constraints });
    setMic(event.target.value);
  };

  const handleCamChange = (event: Event) => {
    setCam(event.target.value);
  };

  const renderSpinner = () => {
    return (
      <CircularProgress
        style={{ height: '200px', width: '200px', margin: 'auto' }}
      />
    );
  };

  const handleJitsiIFrameRef1 = (iframeRef: HTMLDivElement) => {
    iframeRef.style.border = '1px solid #3d3d3d';
    iframeRef.style.position = 'relative';
    iframeRef.style.background = '#3d3d3d';
    // iframeRef.style.height = '100%';
    iframeRef.style.width = '100%';
    iframeRef.style.aspectRatio = '16/9';
  };

  const handleJitsiIFrameRef2 = (iframeRef: HTMLDivElement) => {
    iframeRef.style.border = '1px solid #3d3d3d';
    iframeRef.style.position = 'relative';
    iframeRef.style.background = '#3d3d3d';
    // iframeRef.style.height = '100%';
    iframeRef.style.width = '100%';
    iframeRef.style.aspectRatio = '16/9';
  };

  return (
    <div className={styles.main}>
      {errorMessage}
      <Button
        variant="contained"
        onClick={launchTest}
        className={styles.button}
        style={
          matches
            ? {
              textTransform: 'none',
              borderRadius: 0,
              backgroundColor: '#0a76f6',
              marginBottom: '5px',
              display: 'block',
              margin: '30px auto',
              width: '20%',
            }
            : {
              textTransform: 'none',
              borderRadius: 0,
              backgroundColor: '#0a76f6',
              marginBottom: '5px',
              display: 'block',
              margin: '30px auto',
              width: '50%',
            }
        }
      >
        Lancer le test
      </Button>

      <Accordion
        className="data-fr-theme"
        sx={{
          backgroundColor:
            navTest === true ? '#1DC2A6' : navTest === false ? '#C21E56' : '',
        }}
        expanded={expanded === 'panel1'}
        onChange={handleChange('panel1')}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0 }}>
            Navigateur
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {navTest === true
              ? 'Le navigateur est testé'
              : 'Cliquer pour tester'}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {navTest === true ? (
              <p>
                Votre navigateur est compatible avec webConf de l'état. Pour
                bénéficier d'une meilleure expérience utilisateur nous vous
                recommandons de toujours utiliser les dernières versions stables
                des navigateurs.
              </p>
            ) : navTest === false ? (
              <p>
                Attention, vous utilisez un navigateur qui en l’état dégrade
                fortement la qualité de la conférence pour tous les
                participants. Nous vous conseillons donc d'utiliser les
                navigateurs Edge chromium, Chromium ou Google
                Chrome.L'application mobile "Jitsi Meet" est utilisable pour
                simplement rejoindre un salon.
              </p>
            ) : null}
          </Typography>
          <div>
            <Button
              style={
                matches
                  ? {
                    textTransform: 'none',
                    borderRadius: 0,
                    backgroundColor: '#0a76f6',
                    marginBottom: '5px',
                    display: 'block',
                    margin: '30px auto',
                    width: '20%',
                  }
                  : {
                    textTransform: 'none',
                    borderRadius: 0,
                    backgroundColor: '#0a76f6',
                    marginBottom: '5px',
                    display: 'block',
                    margin: '30px auto',
                    width: '50%',
                  }
              }
              className={styles.micButton}
              onClick={() => {
                setNavTest(null);
                const isChromium = navigator.userAgent.includes('Chrome');
                setTimeout(() => {
                  setNavTest(navTest => isChromium);
                }, 500);
              }}
              variant="contained"
            >
              tester
            </Button>
          </div>
        </AccordionDetails>
      </Accordion>

      <Accordion
        sx={{
          backgroundColor:
            micTest === true ? '#1DC2A6' : micTest === false ? '#C21E56' : '',
        }}
        expanded={expanded === 'panel2'}
        onChange={handleChange('panel2')}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2bh-content"
          id="panel2bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0 }}>
            Microphone
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {micTest === true
              ? 'Le microphone est testé'
              : 'Cliquer pour tester'}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Testez votre microphone en cliquant sur Commencer et Arrêter.
          </Typography>
          <br />
          <div>
            <Box
              sx={{
                minWidth: 300,
                width: '50%',
                margin: 'auto',
                marginBottom: 1,
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="microphone">microphone</InputLabel>
                <Select
                  labelId="microphone"
                  id="microphoneSelect"
                  value={mic}
                  label="microphone"
                  onChange={handleMicChange}
                >
                  {micItems.map(item =>
                    item.deviceId !== 'communications' ? (
                      <MenuItem key={item.deviceId} value={item.deviceId}>
                        {item.label}
                      </MenuItem>
                    ) : null
                  )}
                </Select>
              </FormControl>
            </Box>
            <ReactMediaRecorder
              audio={{ deviceId: mic ? { exact: mic } : undefined }}
              onStart={() => {
                setMicTest(null);
                setErrorMessage(null);
              }}
              onStop={() => {
                setMicTest(true);
              }}
              render={({ status, startRecording, stopRecording, mediaBlobUrl, error }) => {
                // Handle error inside render
                if (error) {
                  setMicTest(false);
                  setErrorMessage(
                    <Alert
                      closable
                      description="Veuillez autoriser le navigateur à utiliser le microphone."
                      onClose={() => { }}
                      small
                      title="Information"
                      severity="error"
                    />
                  );
                }
                return (
                  <>
                    <Typography>Status : {status}</Typography>
                    {mediaBlobUrl && (
                      <audio
                        src={mediaBlobUrl}
                        controls
                        style={{ display: 'block', margin: '10px auto' }}
                      />
                    )}
                  </>
                );
              }}
            />
            <Button
              style={
                matches
                  ? {
                    textTransform: 'none',
                    borderRadius: 0,
                    backgroundColor: '#0a76f6',
                    marginBottom: '5px',
                    display: 'block',
                    margin: '30px auto',
                    width: '20%',
                  }
                  : {
                    textTransform: 'none',
                    borderRadius: 0,
                    backgroundColor: '#0a76f6',
                    marginBottom: '5px',
                    display: 'block',
                    margin: '30px auto',
                    width: '50%',
                  }
              }
              className={styles.micButton}
              onClick={startRecording}
              variant="contained"
            >
              Commencer
            </Button>
            <Button
              style={
                matches
                  ? {
                    textTransform: 'none',
                    borderRadius: 0,
                    backgroundColor: '#0a76f6',
                    marginBottom: '5px',
                    display: 'block',
                    margin: '30px auto',
                    width: '20%',
                  }
                  : {
                    textTransform: 'none',
                    borderRadius: 0,
                    backgroundColor: '#0a76f6',
                    marginBottom: '5px',
                    display: 'block',
                    margin: '30px auto',
                    width: '50%',
                  }
              }
              className={styles.micButton}
              onClick={stopRecording}
              variant="contained"
            >
              Arrêter
            </Button>
          </div>
        </AccordionDetails>
      </Accordion>

      <Accordion
        sx={{
          backgroundColor:
            camTest === true ? '#1DC2A6' : camTest === false ? '#C21E56' : '',
        }}
        expanded={expanded === 'panel3'}
        onChange={handleChange('panel3')}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3bh-content"
          id="panel3bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0 }}>Caméra</Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {camTest === true ? 'La caméra est testée' : 'Cliquer pour tester'}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Testez votre Caméra en cliquant sur Commencer et Arrêter.
          </Typography>
          <Box
            sx={{
              minWidth: 300,
              width: '50%',
              margin: 'auto',
              marginBottom: 1,
              marginTop: 3,
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="camera">Caméra</InputLabel>
              <Select
                labelId="camera"
                id="cameraSelect"
                value={cam}
                label="camera"
                onChange={handleCamChange}
              >
                {camItems.map(item =>
                  item.deviceId !== 'communications' ? (
                    <MenuItem key={item.deviceId} value={item.deviceId}>
                      {item.label}
                    </MenuItem>
                  ) : null
                )}
              </Select>
            </FormControl>
          </Box>
          {expanded === 'panel3' ? (
            <div className={styles.cam}>
              {camItems.map((device, key) => {
                if (device.deviceId === cam) {
                  return (
                    <Webcam
                      className={styles.camera}
                      audio={false}
                      ref={webcamRef}
                      videoConstraints={{ deviceId: device.deviceId }}
                    />
                  );
                }
              })}
              {capturing ? (
                <Button
                  style={
                    matches
                      ? {
                        textTransform: 'none',
                        borderRadius: 0,
                        backgroundColor: '#0a76f6',
                        marginBottom: '5px',
                        display: 'block',
                        margin: '30px auto',
                        width: '20%',
                      }
                      : {
                        textTransform: 'none',
                        borderRadius: 0,
                        backgroundColor: '#0a76f6',
                        marginBottom: '5px',
                        display: 'block',
                        margin: '30px auto',
                        width: '50%',
                      }
                  }
                  className={styles.micButton}
                  onClick={handleStopCaptureClick}
                  variant="contained"
                >
                  Arrêter
                </Button>
              ) : (
                <Button
                  style={
                    matches
                      ? {
                        textTransform: 'none',
                        borderRadius: 0,
                        backgroundColor: '#0a76f6',
                        marginBottom: '5px',
                        display: 'block',
                        margin: '30px auto',
                        width: '20%',
                      }
                      : {
                        textTransform: 'none',
                        borderRadius: 0,
                        backgroundColor: '#0a76f6',
                        marginBottom: '5px',
                        display: 'block',
                        margin: '30px auto',
                        width: '50%',
                      }
                  }
                  className={styles.micButton}
                  onClick={handleStartCaptureClick}
                  variant="contained"
                >
                  Commencer{' '}
                </Button>
              )}
            </div>
          ) : null}
        </AccordionDetails>
      </Accordion>

      <Accordion
        sx={{
          backgroundColor:
            confTest === true ? '#1DC2A6' : confTest === false ? '#C21E56' : '',
        }}
        expanded={expanded === 'panel4'}
        onChange={handleChange('panel4')}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel4bh-content"
          id="panel4bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0 }}>
            Conférence
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {confTest === true
              ? 'La connexion est testée'
              : 'Cliquer pour tester'}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Veuillez attendre l'établissement de la connexion.
          </Typography>
          {expanded === 'panel4' ? (
            <div className={styles.cam}>
              <br />
              {/* <div style={{ display: 'none' }}>{iframe}</div> */}
              <div className={styles.iframe}>
                <JitsiMeeting
                  domain={cfg.VITE_JITSI_DOMAIN}
                  roomName={conference}
                  jwt={jwt}
                  spinner={renderSpinner}
                  configOverwrite={{
                    prejoinConfig: {
                      enabled: false,
                    },
                    toolbarButtons: [
                      'camera',
                      'chat',
                      'desktop',
                      'filmstrip',
                      'hangup',
                      'microphone',
                      'tileview',
                      'toggle-camera',
                      '__end',
                    ],
                    startWithAudioMuted: true,
                    requireDisplayName: false,
                  }}
                  onApiReady={() => {
                    return;
                  }}
                  onReadyToClose={() => {
                    return;
                  }}
                  getIFrameRef={handleJitsiIFrameRef1}
                />
                <br />
                <JitsiMeeting
                  domain={cfg.VITE_JITSI_DOMAIN}
                  roomName={conference}
                  jwt={jwt}
                  spinner={renderSpinner}
                  configOverwrite={{
                    prejoinConfig: {
                      enabled: false,
                    },
                    toolbarButtons: [
                      'camera',
                      'chat',
                      'desktop',
                      'filmstrip',
                      'hangup',
                      'microphone',
                      'tileview',
                      'toggle-camera',
                      '__end',
                    ],
                    startWithAudioMuted: true,
                    requireDisplayName: false,
                  }}
                  onApiReady={() => {
                    return;
                  }}
                  onReadyToClose={() => {
                    return;
                  }}
                  getIFrameRef={handleJitsiIFrameRef2}
                />
              </div>

              <br />
              <br />
              <Typography style={{ margin: 'auto' }}>
                Cliquez sur le boutton pour confirmer la réception.
              </Typography>
              <Button
                style={
                  matches
                    ? {
                      textTransform: 'none',
                      borderRadius: 0,
                      backgroundColor: '#0a76f6',
                      marginBottom: '5px',
                      display: 'block',
                      margin: '30px auto',
                      width: '20%',
                    }
                    : {
                      textTransform: 'none',
                      borderRadius: 0,
                      backgroundColor: '#0a76f6',
                      marginBottom: '5px',
                      display: 'block',
                      margin: '30px auto',
                      width: '80%',
                    }
                }
                className={styles.confButton}
                onClick={handleStartConference}
                variant="contained"
              >
                Je confirme la réception de la vidéo
              </Button>
            </div>
          ) : null}
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
