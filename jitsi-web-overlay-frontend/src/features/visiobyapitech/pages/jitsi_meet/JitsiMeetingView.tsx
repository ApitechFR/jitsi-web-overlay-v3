import React, { useEffect, useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useNavigate } from 'react-router';

import { handleRecordingStatus } from '@/api/services/jitsi/jitsi-recording.service';
import { handleJibriApitechApi } from '@/api/services/jitsi/jibri.service';
import { ConferenceService, RoomService, useApi } from '@/api';
import type { Props } from '@/api';
import { useRuntimeConfig } from '../../../../config/ConfigProvider';
import { ParticipantService } from '@/api/services/participants/participant.service';
import { cleanupExpiredGuests, getStoredGuestParticipant, saveGuestParticipant } from '@/api/services/participants/participants.guests';

const JitsiMeetingView: React.FC<Props> = ({ domain, conferenceName, jwt, displayName, user }) => {
  const participantCountRef = useRef(0);
  const conferenceRef = useRef<any>(null);
  const checkVideoInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myRole = useRef('');
  const navigate = useNavigate();
  const cfg = useRuntimeConfig();

  // wrap des appels API avec useApi (gestion erreur/chargement centralisée)
  const { run: getConfSize } = useApi(ConferenceService.getConfSize);
  const { run: setEnd } = useApi(ConferenceService.setEnd);
  const { run: getRoomByName } = useApi(RoomService.getByName);
  const { run: createRoom } = useApi(RoomService.create);
  const { run: createConf } = useApi(ConferenceService.create);
  const { run: createParticipant } = useApi(ParticipantService.create);

  const enableJibriApitechApi = cfg.VITE_ENABLE_JIBRI_APITECH_API ?? '';
  const jibriApitechApiDomain = cfg.VITE_JIBRI_APITECH_API_DOMAIN ?? '';
  const jitsiAPIOptions = (window as any).jitsiAPIOptions;

  useEffect(() => {
    cleanupExpiredGuests();
  }, []);

  const onClose = () => {
    navigate('/feedback', { state: { room: conferenceName } });
    localStorage.removeItem("conferenceName");
  };
  console.info('JitsiMeetingView render with conference:', conferenceName);
  return (
    <JitsiMeeting
      domain={domain}
      roomName={conferenceName}
      jwt={jwt}
      userInfo={{ displayName: displayName ?? 'Display Name', email: '' }}
      configOverwrite={{
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        prejoinConfig: { enabled: true },
      }}
      interfaceConfigOverwrite={{}}
      getIFrameRef={(iframeRef) => {
        iframeRef.style.height = '100vh';
        iframeRef.style.width = '100%';
      }}
      onApiReady={(api) => {
        console.info('[Jitsi] API prête');
        localStorage.setItem("conferenceName", conferenceName);

        if (enableJibriApitechApi === 'true') {
          handleJibriApitechApi(jitsiAPIOptions, enableJibriApitechApi, jibriApitechApiDomain);
        }

        // fin de réunion
        api.on('readyToClose', async () => {
          try {
            const count = await getConfSize(conferenceName);
            participantCountRef.current = count ?? 0;
            if (participantCountRef.current === 0) {
              await setEnd(conferenceName, new Date().toISOString());
            }
          } catch (e) {
            console.error('[Jitsi] readyToClose error:', e);
          }
        });

        // rejoint la conf
        api.on('videoConferenceJoined', async (evt: any) => {
          const myId = evt.id;

          // rôle du participant local
          api.on('participantRoleChanged', (e: any) => {
            if (e.id === myId) {
              myRole.current = e.role;
              handleRecordingStatus(
                api,
                conferenceName,
                myRole.current,
                checkVideoInterval.current,
                checkTimeout.current
              );
            }
          });

          try {
            // si premier participant → créer la conf
            const count = await getConfSize(conferenceName);
            participantCountRef.current = count ?? 0;

            if (participantCountRef.current === 1 && !conferenceRef.current) {
              const room = await createRoom({ name: conferenceName, created_by: user?.uid });
              const conf = await createConf({ room_uid: room.uid, name: conferenceName });

              conferenceRef.current = conf;
            }

            //Participant connecté (user avec compte)
            if (user?.uid) {
              console.info('Creating participant for user:', user);
              console.log("conferenceRef.current:", conferenceRef.current);
              const participant = await createParticipant({
                conferenceUid: conferenceRef.current.uid,
                userUid: user.uid,
                displayName: user.name,
                role: myRole.current.toUpperCase(),
                email: user.email,
                phone: user.phone,
                status: 'JOINED',
              });
              console.info('Participant created:', participant);
            }

            //Participant invité (pas de user compte)
            else {

              const participantsInfo = api.getParticipantsInfo();
              console.info('Participants info (guest):', participantsInfo);
              const me = participantsInfo.find((p: any) => p.participantId === myId) as any;
              console.info('Me info (guest):', me);

              //find conference
              let conf = conferenceRef.current;
              if (!conf) {
                conf = await ConferenceService.getConferenceByName(conferenceName);
                // if (!conf) {
                //   const room = await createRoom({ name: conferenceName, created_by: user?.uid });
                //   conf = await createConf({ room_uid: room.uid, name: conferenceName });
                // }
                conferenceRef.current = conf;
              }

              const existing = getStoredGuestParticipant(conf.uid);

              if (existing) {
                console.info('Guest already exists');
                return;
              }

              console.log("conferenceRef.current (guest):", conferenceRef.current);

              const guestName = me?.displayName + "_" + me?.participantId || 'Invité';
              const guestEmail = me?.email || "";

              const guestParticipant = await createParticipant({
                conferenceUid: conferenceRef.current.uid,
                displayName: guestName,
                email: guestEmail,
                role: myRole.current?.toUpperCase() || 'ATTENDEE',
                status: 'INVITED',
              });

              if (guestParticipant?.uid) {
                saveGuestParticipant(conferenceRef.current.uid, guestParticipant.uid, 24);
                console.info("Guest participant stored in localStorage:", guestParticipant.uid);
              }

              console.info('Participant (guest) created:', guestParticipant);
            }

          } catch (e) {
            console.error('[Jitsi] join flow error:', e);
          }
        });
      }}
      onReadyToClose={onClose}
    />
  );
};

export default JitsiMeetingView;
