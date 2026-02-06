import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useNavigate } from 'react-router';

import type { Props } from '@/api';
import { ConferenceService, useApi } from '@/api';
import { useJitsiModules } from '../../hooks/useJitsiModules';
import { useConditionalJitsiToolbar } from '../../hooks/useConditionalJitsiToolbar';
import { useConferenceJoinSync } from '../../hooks/useConferenceJoinSync';
import { handleJibriApitechApi } from '@/api/services/jitsi/jibri.service';
import { useRuntimeConfig } from '@/config/ConfigProvider';
import { cleanupExpiredGuests } from '@/api/services/participants/participants.guests';


type JitsiApiLike = {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off?: (event: string, handler: (...args: any[]) => void) => void;
};


const JitsiMeetingView: React.FC<Props> = ({ domain, conferenceName, jwt, displayName, user }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const cfg = useRuntimeConfig();

  const checkVideoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apiRef = useRef<any>(null);
  const handlersRegisteredRef = useRef<boolean>(false);

  const { run: getConfSize } = useApi(ConferenceService.getConfSize);
  const { run: setEnd } = useApi(ConferenceService.setEnd);

  const { modules, loading, error } = useJitsiModules();
  const { apply: applyToolbar } = useConditionalJitsiToolbar();

  const jitsiLang = useMemo(() => {
    const raw = i18n.language || 'fr';
    return raw.split('-')[0]; // 'fr-FR' -> 'fr'
  }, [i18n.language]);

  const { onVideoConferenceJoined, participantCountRef } = useConferenceJoinSync({
    conferenceName,
    user,
    checkVideoIntervalRef,
    checkTimeoutRef
  });

  const enableJibriApitechApi = cfg.VITE_ENABLE_JIBRI_APITECH_API ?? '';
  const jibriApitechApiDomain = cfg.VITE_JIBRI_APITECH_API_DOMAIN ?? '';
  const jitsiAPIOptions = (globalThis as any).jitsiAPIOptions;

  useEffect(() => {
    cleanupExpiredGuests();
  }, []);


  const onClose = () => {
    navigate('/feedback', { state: { room: conferenceName } });
    localStorage.removeItem('conferenceName');
  };

  const configOverwrite = useMemo(() => {

    return {
      defaultLanguage: jitsiLang,
      startWithAudioMuted: true,
      startWithVideoMuted: true,
      prejoinConfig: { enabled: true },

      // IMPORTANT: when a module is disabled here, we also need to disable it in the backend
      etherpad_base: modules?.etherpad ? undefined : '',
      dialInNumbersUrl: modules?.voxify ? undefined : '',
      dialInConfCodeUrl: modules?.voxify ? undefined : '',

      transcription: { enabled: !!modules?.transcription },
      recordingService: { enabled: !!modules?.recording },
      whiteboard: { enabled: !!modules?.excalidraw }
    };
  }, [modules, jitsiLang]);

  // if modules change, re-apply toolbar
  useEffect(() => {
    if (apiRef.current && modules) {
      applyToolbar(apiRef.current, modules);
    }
  }, [applyToolbar, modules]);

  if (loading) return null;
  if (error) return <div>{t('jitsiMeetingView.errorLoadingOptions')}: {error}</div>;
  if (!modules) return <div>{t('jitsiMeetingView.optionsUnavailable')}</div>;
  return (
    <JitsiMeeting
      domain={domain}
      roomName={conferenceName}
      jwt={jwt}
      lang={jitsiLang}
      userInfo={{ displayName: displayName ?? t('jitsiMeetingView.displayName'), email: '' }}
      configOverwrite={configOverwrite}
      getIFrameRef={(iframeRef) => {
        iframeRef.style.width = '100%';
        iframeRef.style.height = '100%';
      }}
      onApiReady={(api) => {
        apiRef.current = api;
        localStorage.setItem('conferenceName', conferenceName);

        // Merge toolbar + overwrites custom Jitsi modules
        applyToolbar(api, modules);

        // Jibri Apitech hook
        if (enableJibriApitechApi === 'true') {
          handleJibriApitechApi(jitsiAPIOptions, enableJibriApitechApi, jibriApitechApiDomain);
        }

        // Event handlers registration 
        if (handlersRegisteredRef.current) return;
        handlersRegisteredRef.current = true;

        // End call
        const onReadyToClose = async () => {
          try {
            const count = await getConfSize(conferenceName);
            participantCountRef.current = count ?? 0;

            if (participantCountRef.current === 0) {
              await setEnd(conferenceName, new Date().toISOString());
            }
          } catch (e) {
            console.error('[Jitsi] readyToClose error:', e);
          }
        };

        // Join meeting
        const onJoined = (evt: any) => {
          onVideoConferenceJoined(api as any, evt);
        };

        (api as JitsiApiLike).on('readyToClose', onReadyToClose);
        (api as JitsiApiLike).on('videoConferenceJoined', onJoined);

        // Best-effort cleanup if the API supports off()
        // (we cannot guarantee this callback will be called again at unmount, but it's better than nothing)
        const tryCleanup = () => {
          if ((api as JitsiApiLike).off) {
            (api as JitsiApiLike).off!('readyToClose', onReadyToClose);
            (api as JitsiApiLike).off!('videoConferenceJoined', onJoined);
          }
        };


        (api as any).__cleanup = tryCleanup;
      }}
      onReadyToClose={onClose}
    />
  );
};

export default JitsiMeetingView;
