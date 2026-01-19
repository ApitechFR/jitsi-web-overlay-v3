import { useCallback, useRef } from 'react';
import { ConferenceService, RoomService, useApi } from '@/api';
import { ParticipantService } from '@/api/services/participants/participant.service';
import { handleRecordingStatus } from '@/api/services/jitsi/jitsi-recording.service';
import { getStoredGuestParticipant, saveGuestParticipant } from '@/api/services/participants/participants.guests';

type JitsiApiLike = {
    on: (event: string, handler: (...args: any[]) => void) => void;
    off?: (event: string, handler: (...args: any[]) => void) => void;
    getParticipantsInfo?: () => any[];
};

type JoinedEvent = { id: string };

type Options = {
    conferenceName: string;
    user?: any;
    checkVideoIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
    checkTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
};

export function useConferenceJoinSync({
    conferenceName,
    user,
    checkVideoIntervalRef,
    checkTimeoutRef
}: Options) {
    const participantCountRef = useRef<number>(0);
    const conferenceRef = useRef<any>(null);
    const myRoleRef = useRef<string>('');
    const roleListenerRef = useRef<((e: any) => void) | null>(null);

    const { run: getConfSize } = useApi(ConferenceService.getConfSize);
    const { run: createRoom } = useApi(RoomService.create);
    const { run: createConf } = useApi(ConferenceService.create);
    const { run: createParticipant } = useApi(ParticipantService.create);
    const { run: getConferenceByName } = useApi(ConferenceService.getConferenceByName);

    const ensureConferenceExists = useCallback(async () => {
        const count = await getConfSize(conferenceName);
        participantCountRef.current = count ?? 0;

        // WARNING: potentielle race condition si plusieurs join simultanés.
        // La vraie protection doit être côté backend (contrainte unique / createOrGet).
        if (participantCountRef.current === 1 && !conferenceRef.current) {
            const room = await createRoom({ name: conferenceName, created_by: user?.uid });
            const conf = await createConf({ room_uid: room.uid, name: conferenceName });
            conferenceRef.current = conf;
        }

        // Si on a encore rien (invité rejoignant une conf existante), on la récupère
        if (!conferenceRef.current) {
            conferenceRef.current = await getConferenceByName(conferenceName);
        }

        return conferenceRef.current;
    }, [conferenceName, createConf, createRoom, getConfSize, getConferenceByName, user?.uid]);

    const registerRoleListener = useCallback((api: JitsiApiLike, myId: string) => {
        // évite multi-register si jamais appelé plusieurs fois
        if (roleListenerRef.current && api.off) {
            api.off('participantRoleChanged', roleListenerRef.current);
            roleListenerRef.current = null;
        }

        const handler = (e: any) => {
            if (e?.id !== myId) return;
            myRoleRef.current = e.role;

            handleRecordingStatus(
                api as any,
                conferenceName,
                myRoleRef.current,
                checkVideoIntervalRef.current,
                checkTimeoutRef.current
            );
        };

        roleListenerRef.current = handler;
        api.on('participantRoleChanged', handler);
    }, [conferenceName, checkTimeoutRef, checkVideoIntervalRef]);

    const onVideoConferenceJoined = useCallback(async (api: JitsiApiLike, evt: JoinedEvent) => {
        const myId = evt.id;

        try {
            registerRoleListener(api, myId);
            const conf = await ensureConferenceExists();

            // Participant connecté
            if (user?.uid) {
                const participant = await createParticipant({
                    conferenceUid: conf.uid,
                    userUid: user.uid,
                    displayName: user.name,
                    role: (myRoleRef.current || '').toUpperCase(),
                    email: user.email,
                    phone: user.phone,
                    status: 'JOINED'
                });

                console.info('[Jitsi] Participant created:', participant?.uid);
                return;
            }

            // Participant invité
            const participantsInfo = api.getParticipantsInfo?.() ?? [];
            const me = participantsInfo.find((p: any) => p.participantId === myId);

            const existing = getStoredGuestParticipant(conf.uid);
            if (existing) {
                console.info('[Jitsi] Guest already exists (localStorage)');
                return;
            }

            const guestName = me?.displayName ? `${me.displayName}_${me.participantId}` : 'Invité';
            const guestEmail = me?.email || '';

            const guestParticipant = await createParticipant({
                conferenceUid: conf.uid,
                displayName: guestName,
                email: guestEmail,
                role: (myRoleRef.current || 'ATTENDEE').toUpperCase(),
                status: 'INVITED'
            });

            if (guestParticipant?.uid) {
                saveGuestParticipant(conf.uid, guestParticipant.uid, 24);
            }

            console.info('[Jitsi] Guest participant created:', guestParticipant?.uid);
        } catch (e) {
            console.error('[Jitsi] join flow error:', e);
        }
    }, [createParticipant, ensureConferenceExists, registerRoleListener, user]);

    return {
        participantCountRef,
        conferenceRef,
        myRoleRef,
        onVideoConferenceJoined
    };
}
