import Swal from 'sweetalert2';
import { ReplayService } from '../replay/replay.service';
import { showLoadingToast } from './toast';
import { getReplayCheckTimeoutMs } from './config';
import { ReplayStatus } from '../replay/replay.types';

export async function startVideo(roomName: string) {
    try {
        const result = await ReplayService.startRecording({
            conference_name: roomName,
            status: ReplayStatus.Started,
            message: "Utilisateur commence l'enregistrement",
        });
        console.info('Replay démarré :', result.status);
    } catch (err) {
        console.error('Erreur startRecording :', err);
    }
}

export async function checkVideo(
    conference_name: string,
    checkVideoInterval: ReturnType<typeof setInterval> | null,
    checkTimeout: ReturnType<typeof setTimeout> | null
) {
    try {
        const response = await ReplayService.getByConfName(conference_name);
        if (!response) {
            console.warn('Aucun replay trouvé pour', conference_name);
            if (checkVideoInterval) clearInterval(checkVideoInterval);
            if (checkTimeout) clearTimeout(checkTimeout);
            localStorage.removeItem('isRecordingStarted');
            return 'error';
        }
        if (!response.ok) {
            console.error("Erreur HTTP :", response.status);
            return "error";
        }

        const data = await response.json();

        if (data.status === 'terminated') {
            // Exemple d'utilisation du timeout dynamique
            const timeoutMs = getReplayCheckTimeoutMs();
            console.log('Replay check timeout (ms):', timeoutMs);
            Swal.fire({
                title: 'Succès !',
                text: `La vidéo pour "${conference_name}" a été enregistrée avec succès.`,
                icon: 'success',
                position: 'top-end',
                showCloseButton: true,
                confirmButtonText: 'Voir l’enregistrement',
                reverseButtons: true,
                customClass: {
                    popup: 'small-swal-popup'
                }
            }).then((result) => {
                if (result.isConfirmed && data.conference?.uid) {
                    window.open(`/visioreplay/${encodeURIComponent(data.conference.uid)}`, '_blank');
                }
            });

            clearTimers(checkVideoInterval, checkTimeout);
            localStorage.removeItem('isRecordingStarted');
        } else if (data.status === 'error-uploading-rsync') {
            Swal.fire({
                title: 'Erreur !',
                text: `Une erreur est survenue lors de l'enregistrement de la vidéo pour "${conference_name}". Veuillez contacter le support.`,
                icon: 'error',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                showCloseButton: true
            });
            clearTimers(checkVideoInterval, checkTimeout);
            localStorage.removeItem('isRecordingStarted');
        }
    } catch (err: any) {
        if (err?.status === 404) {
            console.warn('Aucun replay (404)');
            clearTimers(checkVideoInterval, checkTimeout);
            localStorage.removeItem('isRecordingStarted');
            return 'error';
        }
        console.error('Erreur checkVideo :', err);
        return 'error';
    }
}
export function handleRecordingStatus(
    api: any,
    conference_name: string,
    myRole: string,
    checkVideoInterval: ReturnType<typeof setInterval> | null,
    checkTimeout: ReturnType<typeof setTimeout> | null
) {
    let isRecordingStarted = localStorage.getItem('isRecordingStarted');
    if (isRecordingStarted === 'false' && myRole === 'moderator') {
        retryVerification(conference_name, checkVideoInterval, checkTimeout);
    }

    api.on('recordingStatusChanged', (event: any) => {
        const isRecordingOn = event.on;
        const error = event.error;

        if (isRecordingOn && myRole === 'moderator') {
            isRecordingStarted = "true";
            localStorage.setItem('isRecordingStarted', 'true');
            startVideo(conference_name);
        } else if (error) {
            console.error('Erreur d’enregistrement :', error);
        } else if (isRecordingStarted) {
            isRecordingStarted = "false";
            localStorage.setItem('isRecordingStarted', 'false');
            showLoadingToast("Chargement de l'enregistrement en cours ...");
            retryVerification(conference_name, checkVideoInterval, checkTimeout);
        }
    });
}

function retryVerification(
    conference_name: string,
    checkVideoInterval: ReturnType<typeof setInterval> | null,
    checkTimeout: ReturnType<typeof setTimeout> | null
) {
    if (!checkVideoInterval) {
        checkVideoInterval = setInterval(async () => {
            const result = await checkVideo(conference_name, checkVideoInterval, checkTimeout);
            if (result === 'error') {
                clearTimers(checkVideoInterval, checkTimeout);
                checkVideoInterval = null;
                checkTimeout = null;
                localStorage.removeItem('isRecordingStarted');
            }
        }, 1000);

        checkTimeout = setTimeout(() => {
            clearTimers(checkVideoInterval, checkTimeout);
            checkVideoInterval = null;
            checkTimeout = null;
            localStorage.removeItem('isRecordingStarted');
            Swal.fire({
                title: 'Erreur !',
                text: `Une erreur est survenue lors de l'enregistrement.`,
                icon: 'error',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                showCloseButton: true,
            });
        }, getReplayCheckTimeoutMs());
    }
}

function clearTimers(
    interval: ReturnType<typeof setInterval> | null,
    timeout: ReturnType<typeof setTimeout> | null
) {
    if (interval) clearInterval(interval);
    if (timeout) clearTimeout(timeout);
}