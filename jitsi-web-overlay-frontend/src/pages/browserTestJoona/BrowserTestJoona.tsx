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
//import { ReactMediaRecorder } from 'react-media-recorder';
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
import api from '@/axios/axios';
import CircularProgress from '@mui/material/CircularProgress';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useNavigate } from 'react-router-dom';
import { Alert, Button } from '@ds';
import { useRuntimeConfig } from '@/config/ConfigProvider';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

export default function BrowserTestJoona() {
  const { t } = useTranslation();
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

  type networkTestStatuses = {
    wss: boolean | null;
    tcp: boolean | null;
    udp: boolean | null;
  };
  const [networkTests, setNetworkTests] = useState<networkTestStatuses>({
    wss: null,
    udp: null,
    tcp: null,
  });

  type networkStatsEntries = {
    bandwidth: number | null;
    packetLoss: number | null;
    frameRate: number | null;
    lostImages: number | null;
    framesDropped: number | null;
    jitter: number | null;
  };

  const [networkStats, setNetworkStats] = useState<networkStatsEntries>({
    bandwidth: null as number | null,
    packetLoss: null as number | null,
    frameRate: null as number | null,
    lostImages: null as number | null,
    framesDropped: null as number | null,
    jitter: null as number | null,
  });

  // refs vidéo pour afficher local / remote
  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);

  // état pour afficher dimensions et adresse ICE
  const [localVideoDims, setLocalVideoDims] = useState<{ width: number, height: number } | null>(null);
  const [remoteVideoDims, setRemoteVideoDims] = useState<{ width: number, height: number } | null>(null);
  const [iceConnectionInfo, setIceConnectionInfo] = useState<string | null>(null);

  // durée du test (ms) et intervalle stats
  const STATS_INTERVAL_MS = 1000;
  const STATS_DURATION_MS = 8000; // 8s

  const testNetworkContext = React.useRef({
    localPeerConnection: null as RTCPeerConnection | null,
    remotePeerConnection: null as RTCPeerConnection | null,
    localStream: null as MediaStream | null,
    stats: { tcp: { bitrate: [], framesPerSecond: 0, framesDropped: 0, jitter: 0 }, udp: { bitrate: [], framesPerSecond: 0, framesDropped: 0, jitter: 0 } },
    statuses: { tcp: null as boolean | null, udp: null as boolean | null, wss: null as boolean | null },
    exceptions: {} as Record<string, any>,
    testingProtocol: '' as 'tcp' | 'udp' | '',
  });



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
            description={t('browserTest.allowCamera')}
            onClose={function noRefCheck() {
              return;
            }}
            small
            title={t('browserTest.info')}
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
            description={t('browserTest.allowCamera')}
            onClose={function noRefCheck() {
              return;
            }}
            small
            title={t('browserTest.info')}
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
            description={t('browserTest.allowMic')}
            onClose={function noRefCheck() {
              return;
            }}
            small
            title={t('browserTest.info')}
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
            description={t('browserTest.allowMic')}
            onClose={function noRefCheck() {
              return;
            }}
            small
            title={t('browserTest.info')}
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
      setExpanded('panel4');
    }, 8500);

    setTimeout(async () => {
      await handleNetworkTests();
      setTimeout(() => setExpanded(''), 4000);
    }, 9000);


    setTimeout(() => {
      setExpanded('panel5');
      handleStartConference();
      setTimeout(() => {
        setExpanded('');
      }, 4000);
    }, 13000);
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


  const handleNetworkTests = async () => {
    const context = testNetworkContext.current;
    const websocketUrl = cfg.VITE_WSS_URL
      ? `${cfg.VITE_WSS_URL}`
      : undefined;
    const turnServerSecret = cfg.VITE_TURN_SERVER_SECRET;
    const turnTcpUrls =
      cfg.VITE_TURN_TCP_URLS
        ?.split(',')
        .map(url => url.trim())
        .filter(Boolean) || [];
    const turnUdpUrls =
      cfg.VITE_TURN_UDP_URLS
        ?.split(',')
        .map(url => url.trim())
        .filter(Boolean) || [];



    if (!websocketUrl || !turnServerSecret || !turnTcpUrls.length || !turnUdpUrls.length) {
      setNetworkTests({ wss: false, udp: false, tcp: false });
      setIceConnectionInfo('Configuration réseau manquante (domain/turn).');
      return;
    }
    /** hold the state of ice connection */
    let iceConnected = false;

    // Reset des états
    setNetworkTests({ wss: null, udp: null, tcp: null });
    setNetworkStats({ bandwidth: null, packetLoss: null, frameRate: null, lostImages: null, jitter: null, framesDropped: null });
    setIceConnectionInfo('Waiting...');
    context.stats = {
      udp: { bitrate: [], framesPerSecond: 0, framesDropped: 0, jitter: 0 },
      tcp: { bitrate: [], framesPerSecond: 0, framesDropped: 0, jitter: 0 },
    };
    context.statuses = { wss: null, udp: null, tcp: null };
    context.exceptions = {};

    // ----------------------
    // Test WebSocket
    // ----------------------
    try {
      // const ws = new WebSocket('ws://localhost:8085/xmpp-websocket');

      const ws = new WebSocket(websocketUrl, ['xmpp']);
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), 4000);
        ws.onopen = () => {
          clearTimeout(timer);
          setNetworkTests((prev: networkTestStatuses) => ({ ...prev, wss: true }));
          ws.close();
          resolve();
        };
        ws.onerror = () => {
          clearTimeout(timer);
          setNetworkTests((prev: networkTestStatuses) => ({ ...prev, wss: false }));
          reject(new Error('WebSocket connection failed'));
        };
      });
    } catch (err) {
      setNetworkTests((prev: networkTestStatuses) => ({ ...prev, wss: false }));
    }

    // ----------------------
    // Test WebRTC (UDP + TCP)
    // ----------------------
    const protocols: ('udp' | 'tcp')[] = ['udp', 'tcp'];
    for (const protocol of protocols) {
      // reset iceConnected variable
      iceConnected = false;
      let pcLocal: RTCPeerConnection | null = null;
      let pcRemote: RTCPeerConnection | null = null;
      let localStream: MediaStream | null = null;

      // generate turn credentials
      const { username, credential } = await generateTurnCredentials(turnServerSecret);

      try {
        //ICE servers
        const turn_servers = {
          username,
          credential,
          tcp_urls: turnTcpUrls,
          udp_urls: turnUdpUrls
          // tcp_urls: ['turn:localhost:3478?transport=tcp'], 
          // udp_urls: ['turn:localhost:3478?transport=udp']
        }
        const servers = {
          urls: protocol === 'tcp'
            ? turn_servers.tcp_urls
            : turn_servers.udp_urls,
          username: turn_servers.username,
          credential: turn_servers.credential
        };
        // Config WebRTC
        const rtcConfig: RTCConfiguration = {
          iceServers: [servers],
          iceTransportPolicy: 'relay' as RTCIceTransportPolicy
        };

        pcLocal = new RTCPeerConnection(rtcConfig);
        pcRemote = new RTCPeerConnection(rtcConfig);


        context.localPeerConnection = pcLocal;
        context.remotePeerConnection = pcRemote;

        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 320, height: 240 } });
        localStream.getTracks().forEach(track => pcLocal!.addTrack(track, localStream!));
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

        // Remote track
        pcRemote.ontrack = e => {
          if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== e.streams[0]) {
            remoteVideoRef.current.srcObject = e.streams[0];
          }
        };

        // ICE candidate exchange
        pcLocal.onicecandidate = e => {
          if (e.candidate) pcRemote?.addIceCandidate(e.candidate);
        };
        pcRemote.onicecandidate = e => {
          if (e.candidate) pcLocal?.addIceCandidate(e.candidate);
        };

        // pcLocal.onicegatheringstatechange = () =>

        // ICE connection state
        pcLocal.oniceconnectionstatechange = () => {
          if (['connected', 'completed'].includes(pcLocal!.iceConnectionState)) {
            iceConnected = true;
            setNetworkTests((prev: networkTestStatuses) => ({ ...prev, [protocol]: true }));
          }
        };

        // Offer / answer
        const offer = await pcLocal.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pcLocal.setLocalDescription(offer);
        await pcRemote.setRemoteDescription(offer);

        const answer = await pcRemote.createAnswer();
        await pcRemote.setLocalDescription(answer);
        await pcLocal.setRemoteDescription(answer);

        // Collect stats
        const stats = await pcLocal.getStats();
        let bytesPrev = 0;
        let timestampPrev = 0;
        const bitrates: number[] = [];
        let totalPacketsLost = 0;
        let frameRate = 0;
        let totalJitter = 0;
        let remoteCandidate: any = null;
        let activeCandidatePairId: string | null = null;
        let framesDropped: number | null = null;
        await new Promise<void>(resolve => {
          let samples = 0;

          const interval = setInterval(async () => {
            if (!pcLocal || !pcRemote) return;

            // Stats sur remotePeerConnection
            const remoteStats = await pcRemote.getStats(null);

            remoteStats.forEach((report: any) => {
              const now = report.timestamp;

              // Bitrate
              if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                const bytes = report.bytesReceived;
                if (timestampPrev && bytesPrev) {
                  let bitrate = 8 * (bytes - bytesPrev) / (now - timestampPrev);
                  bitrate = Math.floor(bitrate);
                  if (bitrate > 0) bitrates.push(bitrate);
                }
                bytesPrev = bytes;
                timestampPrev = now;
              }

              // framesPerSecond, framesDropped, packetsLost, jitter
              (['framesPerSecond', 'framesDropped', 'packetsLost', 'jitter'] as const).forEach(item => {
                if (report[item] !== undefined) {
                  if (item === 'framesPerSecond') frameRate = report[item];
                  if (item === 'framesDropped') framesDropped = report[item];
                  if (item === 'packetsLost') totalPacketsLost = report[item];
                  if (item === 'jitter') totalJitter = report[item];
                }
              });

              // Remote candidate via transport (spec-way)
              if (report.type === 'transport') {
                const pair = remoteStats.get(report.selectedCandidatePairId);
                if (pair?.remoteCandidateId) {
                  const rc = remoteStats.get(pair.remoteCandidateId);
                  if (rc?.address && rc?.port) {
                    setIceConnectionInfo(`${rc.address}: ${rc.port}`);
                  }
                }
              }
            });

            samples++;

            if (samples >= 5) {
              clearInterval(interval);

              const avgBitrate = bitrates.length
                ? Math.round(bitrates.reduce((a, b) => a + b, 0) / bitrates.length)
                : 0;
              const lastBitrate = bitrates.length
                ? Math.round(bitrates[bitrates.length - 1])
                : 0;

              setNetworkStats(prev => ({
                ...prev,
                bandwidth: lastBitrate,
                bandwidthAvg: avgBitrate,
                packetLoss: totalPacketsLost,
                frameRate,
                lostImages: framesDropped,
                jitter: Number(totalJitter.toFixed(3)),
              }));

              resolve();
            }
          }, 1000);
        });

        // ICE remote info (last candidate)
        // const remoteCandidate = stats.get?.([...stats.keys()][stats.size - 1]) as any;
        if (activeCandidatePairId) {
          remoteCandidate = stats.get(activeCandidatePairId);
        }
        if (remoteCandidate && remoteCandidate.address && remoteCandidate.port) {
          setIceConnectionInfo(`${remoteCandidate.address}:${remoteCandidate.port} `);
        }

        context.statuses[protocol] = true;

      } catch (err) {
        if (!iceConnected) {
          setNetworkTests((prev: networkTestStatuses) => ({ ...prev, [protocol]: false }));
        } context.statuses[protocol] = false;
        context.exceptions[protocol] = err;
      } finally {
        // Cleanup
        pcLocal?.close();
        pcRemote?.close();
        localStream?.getTracks().forEach(track => track.stop());
        context.localPeerConnection = null;
        context.remotePeerConnection = null;
        context.localStream = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      }
    }
  };


  async function generateTurnCredentials(secret: string, userId: string = 'testuser') {
    const timestamp = Math.floor(Date.now() / 1000) + 24 * 3600; // valide 24h
    const username = `${timestamp}:${userId} `;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(username);

    const key = await crypto.subtle.importKey(
      'raw', keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false, ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const credential = btoa(String.fromCharCode(...new Uint8Array(signature)));

    return { username, credential };
  }


  return (
    <div className={styles.main}>
      {errorMessage}
      <div className={styles.buttonContainer}>
        <Button
          onClick={launchTest}
          className={styles.buttonTestPage}
        >
          {t('browserTest.launchTest')}
        </Button>
      </div>

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
                const isChromium = navigator.userAgent.includes('Chrome');
                setTimeout(() => {
                  setNavTest(navTest => isChromium);
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
            {t('browserTest.microphone')}
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {micTest === true
              ? t('browserTest.microphoneTested')
              : t('browserTest.clickToTest')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {t('browserTest.testMicrophoneInstruction')}
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
                <InputLabel id="microphone">{t('browserTest.microphone')}</InputLabel>
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
              //onStop={onStop}
              //onData={onData}
              strokeColor="green"
              backgroundColor="#BCBCBC"
            />
            <div className={styles.micAccordionContainer}>
              <Button
                className={styles.buttonTestPage}
                onClick={startRecording}
              >
                {t('browserTest.start')}
              </Button>
              <Button
                className={styles.buttonTestPage}
                onClick={stopRecording}
              >
                {t('browserTest.stop')}
              </Button>
            </div>
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
          <Typography sx={{ width: '33%', flexShrink: 0 }}>{t('browserTest.camera')}</Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {camTest === true ? t('browserTest.cameraTested') : t('browserTest.clickToTest')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {t('browserTest.testCameraInstruction')}
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


      {/* Réseau */}
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
          <Typography sx={{ width: '33%', flexShrink: 0 }}>Réseau</Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {networkTests.wss && networkTests.udp && networkTests.tcp
              ? 'Connectivité OK'
              : 'Cliquer pour tester'}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>Ce test vérifie la connectivité réseau : WebSocket, UDP et TCP.</Typography>
          <Button
            //variant="contained"
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
            Lancer les tests réseau
          </Button>

          <div className={styles.networkContainer}>
            {/* Vidéos */}
            <div className={styles.networkVideos}>
              <div>
                <p className={styles.networkVideoLabel}>Vidéo locale</p>
                <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 280, height: 210, background: '#000' }} />
              </div>
              <div>
                <p className={styles.networkVideoLabel}>Vidéo distante</p>
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 280, height: 210, background: '#000' }} />
              </div>
              <div>
                <p className={styles.networkVideoLabel}>ICE info</p>
                <p className={styles.networkIceInfo}>{iceConnectionInfo || '—'}</p>
              </div>
            </div>

            {/* Colonne droite : connectivité + stats */}
            <div className={styles.networkConnectivity}>

              {/* Connectivité */}
              <div>
                <p className={styles.networkSectionTitle}>Connectivité</p>
                <div className={styles.networkTestList}>
                  {[
                    { label: 'WebSocket', status: networkTests.wss },
                    { label: 'Connexion UDP', status: networkTests.udp },
                    { label: 'Connexion TCP', status: networkTests.tcp },
                  ].map(({ label, status }) => (
                    <div
                      key={label}
                      className={`${styles.networkTestItem} ${status === true ? styles.networkTestItemSuccess :
                        status === false ? styles.networkTestItemError :
                          ''
                        } `}
                    >
                      <span className={styles.networkTestLabel}>{label}</span>
                      <span>
                        {status === true
                          ? <CheckIcon color="success" />
                          : status === false
                            ? <CloseIcon color="error" />
                            : <span className={styles.networkTestPending}>En attente...</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div>
                <p className={styles.networkSectionTitle}>Qualité de la connexion</p>
                <div className={styles.networkStatsList}>
                  {[
                    { label: 'Bande passante', value: networkStats.bandwidth != null ? `${networkStats.bandwidth} kbit / s` : '—' },
                    { label: 'Paquets perdus', value: networkStats.packetLoss ?? '—' },
                    { label: 'Débit d\'images', value: networkStats.frameRate != null ? `${networkStats.frameRate} fps` : '—' },
                    { label: 'Images perdues', value: networkStats.lostImages ?? '—' },
                    { label: 'Jitter', value: networkStats.jitter != null ? `${networkStats.jitter} s` : '—' },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className={styles.networkStatItem}
                    >
                      <span style={{ color: '#3a3a3a', fontSize: '0.875rem' }}>{label}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{value}</span>
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
            confTest === true ? '#1DC2A6' : confTest === false ? '#C21E56' : '',
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
          <Typography>
            {t('browserTest.waitConnection')}
          </Typography>
          {expanded === 'panel5' ? (
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
                {t('browserTest.confirmReceptionText')}
              </Typography>
              <div className={styles.buttonContainerAccordion}>
                <Button
                  className={styles.buttonTestPage}
                  onClick={handleStartConference}
                >
                  {t('browserTest.confirmReceptionButton')}
                </Button>
              </div>
            </div>
          ) : null}
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
