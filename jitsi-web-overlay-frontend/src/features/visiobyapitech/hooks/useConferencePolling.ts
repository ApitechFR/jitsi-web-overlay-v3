import { useRef, useState, useCallback } from 'react';
import { ConferenceService } from '../../../api/services/conference/conference.service';

export type PollingPhase = 'idle' | 'first-check' | 'waiting';

interface UseConferencePollingOptions {
    isValidConferenceName: (name: string) => boolean;
    onConferenceStarted: (room: string) => void;
    onWaitingStart?: () => void;
    pollingInterval?: number;
}

export function useConferencePolling({
    isValidConferenceName,
    onConferenceStarted,
    onWaitingStart,
    pollingInterval = 2000,
}: UseConferencePollingOptions) {
    const [phase, setPhase] = useState<PollingPhase>('idle');
    const [isWaiting, setIsWaiting] = useState(false);
    const timerRef = useRef<number | null>(null);
    const cancelledRef = useRef(false);
    const backoffRef = useRef(pollingInterval);
    const currentRoomRef = useRef<string>('');

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const getRoomStateFromBackend = useCallback(async (room: string): Promise<boolean> => {
        try {
            const data = await ConferenceService.state(room);
            if (data && typeof data === 'object' && typeof data.active === 'boolean') {
                return data.active;
            }
            return false;
        } catch {
            return false;
        }
    }, []);

    const pollRoomUntilStarted = useCallback(async (room: string) => {
        if (cancelledRef.current) return;
        const isActive = await getRoomStateFromBackend(room);
        if (isActive) {
            clearTimer();
            setIsWaiting(false);
            setPhase('idle');
            onConferenceStarted(room);
            return;
        }
        backoffRef.current = Math.min(backoffRef.current + 2000, 30000);
        timerRef.current = window.setTimeout(() => pollRoomUntilStarted(room), backoffRef.current) as unknown as number;
    }, [clearTimer, getRoomStateFromBackend, onConferenceStarted]);

    const runFirstCheckThenMaybeWait = useCallback(async (room: string) => {
        if (phase !== 'idle') return;
        if (!isValidConferenceName(room)) return;
        cancelledRef.current = true;
        clearTimer();
        setIsWaiting(false);
        cancelledRef.current = false;
        setPhase('first-check');
        const started = await getRoomStateFromBackend(room);
        if (started) {
            setPhase('idle');
            onConferenceStarted(room);
            return;
        }
        setPhase('waiting');
        setIsWaiting(true);
        if (onWaitingStart) onWaitingStart();
        pollRoomUntilStarted(room);
    }, [phase, isValidConferenceName, clearTimer, getRoomStateFromBackend, onConferenceStarted, onWaitingStart, pollRoomUntilStarted]);

    const stopPolling = useCallback(() => {
        cancelledRef.current = true;
        clearTimer();
        setIsWaiting(false);
        setPhase('idle');
    }, [clearTimer]);

    return {
        phase,
        isWaiting,
        runFirstCheckThenMaybeWait,
        stopPolling,
    };
}
