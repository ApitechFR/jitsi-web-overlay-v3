import { useTranslation } from 'react-i18next';
import React, {
  useState,
  useEffect,
  useCallback,
  ReactNode,
  SyntheticEvent,
} from 'react';
import styles from './BrowserTestJoona.module.css';
import { ReactMic } from 'react-mic';
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
import CircularProgress from '@mui/material/CircularProgress';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Alert, Button } from '@ds';
import { useRuntimeConfig } from '@/config/ConfigProvider';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { ConferenceService } from '@/api';

type NetworkTestStatuses = {
  wss: boolean | null;
  tcp: boolean | null;
  udp: boolean | null;
};

type NetworkStatsEntries = {
  bandwidth: number | null;
  packetLoss: number | null;
  frameRate: number | null;
  lostImages: number | null;
  framesDropped: number | null;
  jitter: number | null;
};

type DeviceChangeEvent = {
  target: {
    value: string;
  };
};

export default function BrowserTestJoona() {
  const { t } = useTranslation();
  const cfg = useRuntimeConfig();
  const CONFERENCE_TEST_DURATION_MS = 5 * 60 * 1000;
  const hostApiRef = React.useRef<any>(null);
  const guestApiRef = React.useRef<any>(null);
  const testTimeoutRef = React.useRef<number | null>(null);
  const guestTimeoutRef = React.useRef<number | null>(null);
  const [expanded, setExpanded] = useState<string | boolean>('');
  const [mic, setMic] = useState('');
  const [cam, setCam] = useState('');
  const [micItems, setMicItems] = useState<MediaDeviceInfo[]>([]);
  const [camItems, setCamItems] = useState<MediaDeviceInfo[]>([]);

  const [navTest, setNavTest] = useState<boolean | null>(null);
  const [micTest, setMicTest] = useState<boolean | null>(null);
  const [camTest, setCamTest] = useState<boolean | null>(null);
  const [conferenceConfirmedByUser, setConferenceConfirmedByUser] = useState(false);
  const [record, setRecord] = useState(false);
  // const [errorMessage, setErrorMessage] = useState<ReactNode | null>(<></>);
  const [errorMessage, setErrorMessage] = useState<ReactNode | null>(null);
  const [confTest, setConfTest] = useState<boolean | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [conference, setConference] = useState<string>('');
  const [jwt, setJwt] = useState<string | undefined>();
  const [showGuestMeeting, setShowGuestMeeting] = useState(false);
  const [matches, setMatches] = useState<boolean>(
    window.matchMedia('(min-width: 600px)').matches
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [isTestingNetwork, setIsTestingNetwork] = useState(false);

  const [networkTests, setNetworkTests] = useState<NetworkTestStatuses>({
    wss: null,
    udp: null,
    tcp: null,
  });

  const [networkStats, setNetworkStats] = useState<NetworkStatsEntries>({
    bandwidth: null,
    packetLoss: null,
    frameRate: null,
    lostImages: null,
    framesDropped: null,
    jitter: null,
  });

  const [iceConnectionInfo, setIceConnectionInfo] = useState<string | null>(
    null
  );

  const webcamRef = React.useRef<Webcam | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);

  const micStreamRef = React.useRef<MediaStream | null>(null);
  const camStreamRef = React.useRef<MediaStream | null>(null);
  const networkStreamRef = React.useRef<MediaStream | null>(null);

  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);


  const resetConferenceResult = () => {
    setConfTest(null);
    setConferenceConfirmedByUser(false);
  };


  const testNetworkContext = React.useRef({
    localPeerConnection: null as RTCPeerConnection | null,
    remotePeerConnection: null as RTCPeerConnection | null,
    localStream: null as MediaStream | null,
    stats: {
      tcp: { bitrate: [] as number[], framesPerSecond: 0, framesDropped: 0, jitter: 0 },
      udp: { bitrate: [] as number[], framesPerSecond: 0, framesDropped: 0, jitter: 0 },
    },
    statuses: { tcp: null as boolean | null, udp: null as boolean | null, wss: null as boolean | null },
    exceptions: {} as Record<string, unknown>,
    testingProtocol: '' as 'tcp' | 'udp' | '',
  });

  const styleJitsiIframe = (iframeRef: HTMLDivElement) => {
    iframeRef.style.border = '1px solid #3d3d3d';
    iframeRef.style.position = 'relative';
    iframeRef.style.background = '#3d3d3d';
    iframeRef.style.width = '100%';
    iframeRef.style.aspectRatio = '16/9';
  };
  const wait = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

  const stopStream = (stream: MediaStream | null) => {
    stream?.getTracks().forEach(track => track.stop());
  };
  const clearConferenceTimers = () => {
    if (testTimeoutRef.current) {
      window.clearTimeout(testTimeoutRef.current);
      testTimeoutRef.current = null;
    }

    if (guestTimeoutRef.current) {
      window.clearTimeout(guestTimeoutRef.current);
      guestTimeoutRef.current = null;
    }
  };
  const handleConfirmReception = () => {
    setConferenceConfirmedByUser(true);
  };


  const stopAllDeviceStreams = useCallback(() => {
    stopStream(micStreamRef.current);
    stopStream(camStreamRef.current);
    stopStream(networkStreamRef.current);

    micStreamRef.current = null;
    camStreamRef.current = null;
    networkStreamRef.current = null;
  }, []);

  const stopWebcamComponentStream = useCallback(() => {
    const stream = webcamRef.current?.video?.srcObject as
      | MediaStream
      | undefined;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      webcamRef.current!.video!.srcObject = null;
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);
  useEffect(() => {
    return () => {
      // clearConferenceTimers();
      stopConferenceMeetings();
      resetConferenceResult();
    };
  }, []);

  useEffect(() => {
    return () => {
      stopAllDeviceStreams();
      stopWebcamComponentStream();
      try {
        mediaRecorderRef.current?.stop?.();
      } catch {
        // ignore
      }
    };
  }, [stopAllDeviceStreams, stopWebcamComponentStream]);


  useEffect(() => {
    const initDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audio = devices.filter(device => device.kind === 'audioinput');
        const video = devices.filter(device => device.kind === 'videoinput');

        setMicItems(audio);
        setCamItems(video);

        if (audio.length > 0) setMic(audio[0].deviceId);
        if (video.length > 0) setCam(video[0].deviceId);

        stream.getTracks().forEach(track => track.stop());
      } catch {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audio = devices.filter(device => device.kind === 'audioinput');
        const video = devices.filter(device => device.kind === 'videoinput');

        setMicItems(audio);
        setCamItems(video);

        if (audio.length > 0) setMic(audio[0].deviceId);
        if (video.length > 0) setCam(video[0].deviceId);
      }
    };

    initDevices();
  }, []);
  const stopConferenceMeetings = () => {
    clearConferenceTimers();
    hostApiRef.current?.executeCommand?.('hangup');
    guestApiRef.current?.executeCommand?.('hangup');
    hostApiRef.current = null;
    guestApiRef.current = null;
    setShowGuestMeeting(false);
  };


  const handleChange =
    (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
      if (panel === 'panel5' && !isExpanded) {
        stopConferenceMeetings();

      }

      setExpanded(isExpanded ? panel : '');
    };


  const handleDataAvailable = useCallback(({ data }: BlobEvent) => {
    if (data.size > 0) {
      setRecordedChunks(prev => [...prev, data]);
    }
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      stopStream(micStreamRef.current);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: mic ? { deviceId: { exact: mic } } : true,
      });

      micStreamRef.current = stream;
      setErrorMessage(null);
      setRecord(true);
      setMicTest(null);

      return true;
    } catch {
      setMicTest(false);
      setErrorMessage(
        <Alert
          closable
          description={t('browserTest.allowMic')}
          onClose={() => { }}
          small
          title={t('browserTest.info')}
          severity="error"
        />
      );
      return false;
    }
  }, [mic, t]);

  const stopRecording = useCallback(() => {
    setRecord(false);
    stopStream(micStreamRef.current);
    micStreamRef.current = null;
    setMicTest(true);
  }, []);

  const handleStartCaptureClick = useCallback(async () => {
    try {
      setCamTest(null);
      setRecordedChunks([]);
      stopWebcamComponentStream();
      stopStream(camStreamRef.current);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: cam ? { deviceId: { exact: cam } } : true,
        audio: false,
      });

      camStreamRef.current = mediaStream;
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
    } catch {
      setCamTest(false);
      setErrorMessage(
        <Alert
          closable
          description={t('browserTest.allowCamera')}
          onClose={() => { }}
          small
          title={t('browserTest.info')}
          severity="error"
        />
      );
    }
  }, [cam, handleDataAvailable, stopWebcamComponentStream, t]);

  const handleStopCaptureClick = useCallback(() => {
    try {
      mediaRecorderRef.current?.stop?.();
    } catch {
      // ignore
    }

    setCapturing(false);
    stopStream(camStreamRef.current);
    camStreamRef.current = null;
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    if (!capturing && recordedChunks.length > 0) {
      setCamTest(true);
    } else if (!capturing && recordedChunks.length === 0) {
      setCamTest(null);
    }
  }, [capturing, recordedChunks]);



  const handleMicChange = (event: DeviceChangeEvent) => {
    stopStream(micStreamRef.current);
    micStreamRef.current = null;
    setMic(event.target.value);
  };

  const handleCamChange = (event: DeviceChangeEvent) => {
    stopStream(camStreamRef.current);
    camStreamRef.current = null;
    stopWebcamComponentStream();
    setCam(event.target.value);
  };

  const renderSpinner = () => {
    return (
      <CircularProgress
        style={{ height: '200px', width: '200px', margin: 'auto' }}
      />
    );
  };

  const handleNetworkTests = useCallback(async () => {
    setIsTestingNetwork(true);

    try {
      stopAllDeviceStreams();
      stopWebcamComponentStream();

      const context = testNetworkContext.current;

      const websocketUrl = cfg.VITE_WSS_URL ? `${cfg.VITE_WSS_URL}` : undefined;
      const turnServerSecret = cfg.VITE_TURN_SERVER_SECRET;

      const turnTcpUrls =
        cfg.VITE_TURN_TCP_URLS?.split(',').map(url => url.trim()).filter(Boolean) || [];

      const turnUdpUrls =
        cfg.VITE_TURN_UDP_URLS?.split(',').map(url => url.trim()).filter(Boolean) || [];


      if (!websocketUrl || !turnServerSecret || !turnTcpUrls.length || !turnUdpUrls.length) {
        console.error('[TURN TEST] Configuration réseau manquante (domain/turn).');
        setNetworkTests({ wss: false, udp: false, tcp: false });
        setIceConnectionInfo('Configuration réseau manquante (domain/turn).');
        return;
      }

      setNetworkTests({ wss: null, udp: null, tcp: null });
      setNetworkStats({
        bandwidth: null,
        packetLoss: null,
        frameRate: null,
        lostImages: null,
        framesDropped: null,
        jitter: null,
      });
      setIceConnectionInfo('Waiting...');

      context.stats = {
        udp: { bitrate: [], framesPerSecond: 0, framesDropped: 0, jitter: 0 },
        tcp: { bitrate: [], framesPerSecond: 0, framesDropped: 0, jitter: 0 },
      };
      context.statuses = { wss: null, udp: null, tcp: null };
      context.exceptions = {};

      try {

        const ws = new WebSocket(websocketUrl, ['xmpp']);

        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('timeout')), 4000);

          ws.onopen = () => {
            clearTimeout(timer);
            setNetworkTests(prev => ({ ...prev, wss: true }));
            ws.close();
            console.log('[TURN TEST] WebSocket connection successful');
            resolve();
          };

          ws.onerror = e => {
            clearTimeout(timer);
            setNetworkTests(prev => ({ ...prev, wss: false }));
            console.error('[TURN TEST] WebSocket connection failed', e);
            reject(new Error('WebSocket connection failed'));
          };
        });
      } catch (err) {
        setNetworkTests(prev => ({ ...prev, wss: false }));
        console.error('[TURN TEST] WebSocket test error:', err);
      }

      const protocols: ('udp' | 'tcp')[] = ['udp', 'tcp'];

      for (const protocol of protocols) {
        let iceConnected = false;
        let pcLocal: RTCPeerConnection | null = null;
        let pcRemote: RTCPeerConnection | null = null;

        try {
          const { username, credential } = await generateTurnCredentials(
            turnServerSecret
          );

          const rtcConfig: RTCConfiguration = {
            iceServers: [
              {
                urls: protocol === 'tcp' ? turnTcpUrls : turnUdpUrls,
                username,
                credential,
              },
            ],
            iceTransportPolicy: 'relay',
          };

          pcLocal = new RTCPeerConnection(rtcConfig);
          pcRemote = new RTCPeerConnection(rtcConfig);

          context.localPeerConnection = pcLocal;
          context.remotePeerConnection = pcRemote;

          networkStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: 320, height: 240 },
          });

          context.localStream = networkStreamRef.current;

          networkStreamRef.current.getTracks().forEach(track => {
            pcLocal!.addTrack(track, networkStreamRef.current!);
          });

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = networkStreamRef.current;
          }

          pcRemote.ontrack = e => {
            if (
              remoteVideoRef.current &&
              remoteVideoRef.current.srcObject !== e.streams[0]
            ) {
              remoteVideoRef.current.srcObject = e.streams[0];
            }
          };

          pcLocal.onicecandidate = e => {
            if (e.candidate) {
              pcRemote?.addIceCandidate(e.candidate);
            }
          };

          pcRemote.onicecandidate = e => {
            if (e.candidate) {
              pcLocal?.addIceCandidate(e.candidate);
            }
          };

          pcLocal.oniceconnectionstatechange = () => {

            if (pcLocal && ['connected', 'completed'].includes(pcLocal.iceConnectionState)) {
              iceConnected = true;
              setNetworkTests(prev => ({ ...prev, [protocol]: true }));
            }
          };

          const offer = await pcLocal.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });

          await pcLocal.setLocalDescription(offer);
          await pcRemote.setRemoteDescription(offer);

          const answer = await pcRemote.createAnswer();
          await pcRemote.setLocalDescription(answer);
          await pcLocal.setRemoteDescription(answer);

          let bytesPrev = 0;
          let timestampPrev = 0;
          const bitrates: number[] = [];
          let totalPacketsLost = 0;
          let frameRate = 0;
          let totalJitter = 0;
          let framesDropped: number | null = null;

          await new Promise<void>(resolve => {
            let samples = 0;

            const interval = setInterval(async () => {
              if (!pcRemote) return;

              const remoteStats = await pcRemote.getStats(null);

              remoteStats.forEach((report: any) => {
                const now = report.timestamp;

                if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                  const bytes = report.bytesReceived;

                  if (timestampPrev && bytesPrev) {
                    let bitrate = (8 * (bytes - bytesPrev)) / (now - timestampPrev);
                    bitrate = Math.floor(bitrate);
                    if (bitrate > 0) bitrates.push(bitrate);
                  }

                  bytesPrev = bytes;
                  timestampPrev = now;
                }

                if (report.framesPerSecond !== undefined) frameRate = report.framesPerSecond;
                if (report.framesDropped !== undefined) framesDropped = report.framesDropped;
                if (report.packetsLost !== undefined) totalPacketsLost = report.packetsLost;
                if (report.jitter !== undefined) totalJitter = report.jitter;

                if (report.type === 'transport') {
                  const pair = remoteStats.get(report.selectedCandidatePairId);
                  if (pair?.remoteCandidateId) {
                    const rc = remoteStats.get(pair.remoteCandidateId);
                    if (rc?.address && rc?.port) {
                      setIceConnectionInfo(`${rc.address}:${rc.port}`);
                    }
                  }
                }
              });

              samples++;

              if (samples >= 5) {
                clearInterval(interval);

                const lastBitrate = bitrates.length
                  ? Math.round(bitrates[bitrates.length - 1])
                  : 0;

                setNetworkStats(prev => ({
                  ...prev,
                  bandwidth: lastBitrate,
                  packetLoss: totalPacketsLost,
                  frameRate,
                  lostImages: framesDropped,
                  framesDropped,
                  jitter: Number(totalJitter.toFixed(3)),
                }));

                resolve();
              }
            }, 1000);
          });

          context.statuses[protocol] = true;
        } catch (err) {
          if (!iceConnected) {
            setNetworkTests(prev => ({ ...prev, [protocol]: false }));
            console.error(`[TURN TEST] ${protocol} connection failed`, err);
          }

          context.statuses[protocol] = false;
          context.exceptions[protocol] = err;
        } finally {
          pcLocal?.close();
          pcRemote?.close();

          stopStream(networkStreamRef.current);
          networkStreamRef.current = null;

          context.localPeerConnection = null;
          context.remotePeerConnection = null;
          context.localStream = null;

          if (localVideoRef.current) localVideoRef.current.srcObject = null;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        }
      }
    } finally {
      setIsTestingNetwork(false);
    }
  }, [cfg, stopAllDeviceStreams, stopWebcamComponentStream]);

  async function generateTurnCredentials(
    secret: string,
    userId: string = 'testuser'
  ) {
    const timestamp = Math.floor(Date.now() / 1000) + 24 * 3600;
    const username = `${timestamp}:${userId}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(username);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const credential = btoa(
      String.fromCharCode(...new Uint8Array(signature))
    );

    return { username, credential };
  }

  const launchTest = async () => {
    stopConferenceMeetings();
    resetConferenceResult();

    setExpanded(false);
    setNavTest(null);
    setMicTest(null);
    setCamTest(null);
    setErrorMessage(null);
    setLoading(true);

    try {
      //const isChromium = navigator.userAgent.includes('Chrome');
      const isChromium = /Chrome|Chromium|Edg/.test(navigator.userAgent);

      setExpanded('panel1');
      await wait(200);
      setNavTest(isChromium);

      setExpanded('panel2');
      const micOk = await startRecording();

      if (micOk) {
        await wait(3000);
        stopRecording();
      }

      setExpanded('panel3');
      await handleStartCaptureClick();
      await wait(3000);
      handleStopCaptureClick();

      setExpanded('panel4');
      await handleNetworkTests();

      await wait(500);
      try {
        const res = await ConferenceService.jitsiTestJwt();

        if (res.token && res.roomName) {
          setJwt(res.token);
          setConference(res.roomName);
          setExpanded('panel5');
        } else {
          setConfTest(false);
          setJwt(undefined);
          setConference('');
          setErrorMessage(
            <Alert
              closable
              description="Impossible de récupérer le jeton de test Jitsi."
              onClose={() => { }}
              small
              title="Erreur"
              severity="error"
            />
          );
        }
      } catch {
        setConfTest(false);
        setJwt(undefined);
        setConference('');
        setErrorMessage(
          <Alert
            closable
            description="Impossible de récupérer le jeton de test Jitsi."
            onClose={() => { }}
            small
            title="Erreur"
            severity="error"
          />
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.main}>
      {errorMessage}

      <div className={styles.buttonContainer}>
        <Button onClick={launchTest} className={styles.buttonTestPage} disabled={loading}>
          {t('browserTest.launchTest')}
        </Button>
      </div>

      <Accordion
        className="data-fr-theme"
        sx={{
          backgroundColor:
            navTest === true ? 'var(--background-contrast-success)' : navTest === false ? 'var(--background-contrast-error)' : '',
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
            {t('browserTest.browser')}
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {navTest === true
              ? t('browserTest.browserTested')
              : t('browserTest.clickToTest')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {navTest === true ? (
              <p>{t('browserTest.browserOk')}</p>
            ) : navTest === false ? (
              <p>{t('browserTest.browserKo')}</p>
            ) : null}
          </Typography>
          <div className={styles.buttonContainerAccordion}>
            <Button
              className={styles.buttonTestPage}
              onClick={() => {
                setNavTest(null);
                //const isChromium = navigator.userAgent.includes('Chrome');
                const isChromium = /Chrome|Chromium|Edg/.test(navigator.userAgent);
                setTimeout(() => {
                  setNavTest(isChromium);
                }, 500);
              }}
            >
              {t('browserTest.test')}
            </Button>
          </div>
        </AccordionDetails>
      </Accordion>

      <Accordion
        sx={{
          backgroundColor:
            micTest === true ? 'var(--background-contrast-success)' : micTest === false ? 'var(--background-contrast-error)' : '',
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
            {t('browserTest.microphone')}
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {micTest === true
              ? t('browserTest.microphoneTested')
              : t('browserTest.clickToTest')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>{t('browserTest.testMicrophoneInstruction')}</Typography>
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
                <InputLabel id="microphone">
                  {t('browserTest.microphone')}
                </InputLabel>
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
            <ReactMic
              record={record}
              visualSetting="frequencyBars"
              className={styles.mic}
              strokeColor="green"
              backgroundColor="#BCBCBC"
            />
            <div className={styles.micAccordionContainer}>
              <Button className={styles.buttonTestPage} onClick={startRecording}>
                {t('browserTest.start')}
              </Button>
              <Button className={styles.buttonTestPage} onClick={stopRecording}>
                {t('browserTest.stop')}
              </Button>
            </div>
          </div>
        </AccordionDetails>
      </Accordion>

      <Accordion
        sx={{
          backgroundColor:
            camTest === true ? 'var(--background-contrast-success)' : camTest === false ? 'var(--background-contrast-error)' : '',
        }}
        expanded={expanded === 'panel3'}
        onChange={handleChange('panel3')}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3bh-content"
          id="panel3bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0 }}>
            {t('browserTest.camera')}
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {camTest === true
              ? t('browserTest.cameraTested')
              : t('browserTest.clickToTest')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>{t('browserTest.testCameraInstruction')}</Typography>
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
              <InputLabel id="camera">{t('browserTest.camera')}</InputLabel>
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
                      {item.label || t('browserTest.unknownDevice')}
                    </MenuItem>
                  ) : null
                )}
              </Select>
            </FormControl>
          </Box>

          {expanded === 'panel3' && !isTestingNetwork ? (
            <div className={styles.cam}>
              {camItems.map(device => {
                if (device.deviceId === cam) {
                  return (
                    <Webcam
                      key={device.deviceId}
                      className={styles.camera}
                      audio={false}
                      ref={webcamRef}
                      videoConstraints={{ deviceId: device.deviceId }}
                    />
                  );
                }
                return null;
              })}
              <div className={styles.buttonContainerAccordion}>
                {capturing ? (
                  <Button
                    className={styles.buttonTestPage}
                    onClick={handleStopCaptureClick}
                  >
                    {t('browserTest.stop')}
                  </Button>
                ) : (
                  <Button
                    className={styles.buttonTestPage}
                    onClick={handleStartCaptureClick}
                  >
                    {t('browserTest.start')}
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </AccordionDetails>
      </Accordion>

      <Accordion
        sx={{
          backgroundColor:
            networkTests.wss && networkTests.udp && networkTests.tcp
              ? 'var(--background-contrast-success)'
              : networkTests.wss === false ||
                networkTests.udp === false ||
                networkTests.tcp === false
                ? 'var(--background-contrast-error)'
                : '',
        }}
        expanded={expanded === 'panel4'}
        onChange={handleChange('panel4')}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel4bh-content"
          id="panel4bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0 }}>{t('browserTest.network')}</Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {networkTests.wss && networkTests.udp && networkTests.tcp
              ? t('browserTest.networkOk')
              : t('browserTest.clickToTestNetwork')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {t('browserTest.networkTestDescription')}
          </Typography>
          <Button
            onClick={handleNetworkTests}
            style={{
              textTransform: 'none',
              borderRadius: 0,
              backgroundColor: '#0a76f6',
              margin: '30px auto',
              display: 'block',
              width: matches ? '20%' : '50%',
            }}
          >
            {t('browserTest.launchNetworkTests')}
          </Button>

          <div className={styles.networkContainer}>
            <div className={styles.networkVideos}>
              <div>
                <p className={styles.networkVideoLabel}>{t('browserTest.localVideo')}</p>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: 280, height: 210, background: '#000' }}
                />
              </div>
              <div>
                <p className={styles.networkVideoLabel}>{t('browserTest.remoteVideo')}</p>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{ width: 280, height: 210, background: '#000' }}
                />
              </div>
              <div>
                <p className={styles.networkVideoLabel}>{t('browserTest.iceInfo')}</p>
                <p className={styles.networkIceInfo}>
                  {iceConnectionInfo || t('browserTest.valueMissing')}
                </p>
              </div>
            </div>

            <div className={styles.networkConnectivity}>
              <div>
                <p className={styles.networkSectionTitle}>{t('browserTest.connectivity')}</p>
                <div className={styles.networkTestList}>
                  {[
                    { label: t('browserTest.websocket'), status: networkTests.wss },
                    { label: t('browserTest.udpConnection'), status: networkTests.udp },
                    { label: t('browserTest.tcpConnection'), status: networkTests.tcp },
                  ].map(({ label, status }) => (
                    <div
                      key={label}
                      className={`${styles.networkTestItem} ${status === true
                        ? styles.networkTestItemSuccess
                        : status === false
                          ? styles.networkTestItemError
                          : ''
                        }`}
                    >
                      <span className={styles.networkTestLabel}>{label}</span>
                      <span>
                        {status === true ? (
                          <CheckIcon color="success" />
                        ) : status === false ? (
                          <CloseIcon color="error" />
                        ) : (
                          <span className={styles.networkTestPending}>
                            {t('browserTest.pending')}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className={styles.networkSectionTitle}>
                  {t('browserTest.connectionQuality')}
                </p>
                <div className={styles.networkStatsList}>
                  {[
                    {
                      label: t('browserTest.bandwidth'),
                      value:
                        networkStats.bandwidth != null
                          ? `${networkStats.bandwidth} kbit / s`
                          : t('browserTest.valueMissing'),
                    },
                    {
                      label: t('browserTest.packetLoss'),
                      value: networkStats.packetLoss ?? t('browserTest.valueMissing'),
                    },
                    {
                      label: t('browserTest.frameRate'),
                      value:
                        networkStats.frameRate != null
                          ? `${networkStats.frameRate} fps`
                          : t('browserTest.valueMissing'),
                    },
                    {
                      label: t('browserTest.lostImages'),
                      value: networkStats.lostImages ?? t('browserTest.valueMissing'),
                    },
                    {
                      label: t('browserTest.jitter'),
                      value:
                        networkStats.jitter != null
                          ? `${networkStats.jitter} s`
                          : t('browserTest.valueMissing'),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className={styles.networkStatItem}>
                      <span style={{ color: '#3a3a3a', fontSize: '0.875rem' }}>
                        {label}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AccordionDetails>
      </Accordion>
      <Accordion
        sx={{
          backgroundColor:
            confTest === true
              ? 'var(--background-contrast-success)'
              : confTest === false
                ? 'var(--background-contrast-error)'
                : '',
        }}
        expanded={expanded === 'panel5'}
        onChange={handleChange('panel5')}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel5bh-content"
          id="panel5bh-header"
        >
          <Typography sx={{ width: '33%', flexShrink: 0 }}>
            {t('browserTest.conference')}
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {confTest === true
              ? t('browserTest.connectionTested')
              : t('browserTest.clickToTest')}
          </Typography>
        </AccordionSummary>

        <AccordionDetails>
          <Typography>{t('browserTest.waitConnection')}</Typography>

          {expanded === 'panel5' ? (
            <div className={styles.cam}>
              <br />

              <div className={styles.iframe}>
                {jwt && conference ? (
                  <>
                    <JitsiMeeting
                      domain={cfg.VITE_JITSI_DOMAIN}
                      roomName={conference}
                      jwt={jwt}
                      spinner={renderSpinner}
                      configOverwrite={{
                        prejoinConfig: { enabled: false },
                        requireDisplayName: false,
                        userInfo: {
                          displayName: 'Test Host',
                          email: 'host@test.local',
                        },
                      }}
                      onApiReady={(api) => {
                        hostApiRef.current = api;

                        if (!showGuestMeeting && !guestTimeoutRef.current) {
                          guestTimeoutRef.current = window.setTimeout(() => {
                            setShowGuestMeeting(true);
                            guestTimeoutRef.current = null;
                          }, 1500);
                        }

                        if (!testTimeoutRef.current) {
                          testTimeoutRef.current = window.setTimeout(() => {
                            hostApiRef.current?.executeCommand('hangup');
                            guestApiRef.current?.executeCommand('hangup');
                            setConfTest(true);
                            clearConferenceTimers();
                          }, CONFERENCE_TEST_DURATION_MS);
                        }
                      }}
                      onReadyToClose={() => {
                        hostApiRef.current = null;
                      }}
                      getIFrameRef={styleJitsiIframe}
                    />

                    <br />

                    {showGuestMeeting && (
                      <JitsiMeeting
                        domain={cfg.VITE_JITSI_DOMAIN}
                        roomName={conference}
                        spinner={renderSpinner}
                        configOverwrite={{
                          prejoinConfig: { enabled: false },
                          requireDisplayName: false,
                          userInfo: {
                            displayName: 'Test Guest',
                            email: 'guest@test.local',
                          },
                        }}
                        onApiReady={(api) => {
                          guestApiRef.current = api;
                        }}
                        onReadyToClose={() => {
                          guestApiRef.current = null;
                        }}
                        getIFrameRef={styleJitsiIframe}
                      />
                    )}
                  </>
                ) : (
                  renderSpinner()
                )}

                <br />
                <br />

                <Typography style={{ margin: 'auto' }}>
                  {t('browserTest.confirmReceptionText')}
                </Typography>

                <div className={styles.buttonContainerAccordion}>
                  <Button
                    className={styles.buttonTestPage}
                    //onClick={handleStartConference}
                    onClick={handleConfirmReception}
                  >
                    {t('browserTest.confirmReceptionButton')}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </AccordionDetails>
      </Accordion>
    </div>
  );
}