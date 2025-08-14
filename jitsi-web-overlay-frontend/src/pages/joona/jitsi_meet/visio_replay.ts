import Swal from "sweetalert2";


export const API_BASE_URL = import.meta.env.VITE_API_URL;

const envValue = import.meta.env.VITE_REPLAY_CHECK_TIMEOUT_MS;
const parsed = Number(envValue);
export const REPLAY_CHECK_TIMEOUT_MS = Number.isFinite(parsed) ? parsed : 600000;

export const showLoadingToast = (message: string) => {
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

export const startVideo = async (roomName: string) => {
    const conference_name = roomName;

    const status = "started";
    const message = "Utilisateur commence l'enregistrement";

    try {
        const response = await fetch(`${API_BASE_URL}/replays/start_recording`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status, message, conference_name }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log("Replay créé avec status:", result);
        } else {
            const errorData = await response.json();
            console.error("Erreur :", errorData);
        }
    } catch (error) {
        console.error("Erreur :", error);
    }
};

export const checkVideo = async (roomName: string, checkVideoInterval: NodeJS.Timeout | null, checkTimeout: NodeJS.Timeout | null) => {
    const conference_name = roomName;

    try {
        const response = await fetch(`${API_BASE_URL}/replays/${encodeURIComponent(conference_name)}`);
        const data = await response.json();

        if (data.status === "terminated") {
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
                if (result.isConfirmed) {
                    window.location.href = `/visioreplay?room=${encodeURIComponent(data.conference_uid)}`;
                }
            });

            if (checkVideoInterval) clearInterval(checkVideoInterval);
            if (checkTimeout) clearTimeout(checkTimeout);
            checkVideoInterval = null;
            checkTimeout = null;

        } else if (data.status === "error-uploading-rsync") {
            Swal.fire({
                title: 'Erreur !',
                text: `Une erreur est survenue lors de l'enregistrement de la vidéo pour "${conference_name}". Veuillez contacter le support.`,
                icon: 'error',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                showCloseButton: true
            });

            if (checkVideoInterval) clearInterval(checkVideoInterval);
            if (checkTimeout) clearTimeout(checkTimeout);
            checkVideoInterval = null;
            checkTimeout = null;
        }

    } catch (error) {
        console.error('Erreur lors de la vérification du replay :', error);
    }
};

export const handleRecordingStatus = (iframe: any, api: any, roomName: string, checkVideoInterval: NodeJS.Timeout | null, checkTimeout: NodeJS.Timeout | null) => {
    let isRecordingStarted = false;
    let isLocalStopClicked = false;

    setInterval(() => {
        const iframeDocument = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (!iframeDocument) return;

        const startRecordingButton = iframeDocument.getElementById("modal-dialog-ok-button");
        const startRecordingDiv = iframeDocument.getElementById("dialog-title");

        if (
            startRecordingButton &&
            startRecordingDiv &&
            startRecordingDiv.textContent.includes("Commencer l'enregistrement")
        ) {
            if (!startRecordingButton.dataset.listenerAdded) {
                startRecordingButton.dataset.listenerAdded = "true";
                startRecordingButton.addEventListener("click", () => {
                    console.log("[Local] Démarrage de l'enregistrement détecté");
                    startVideo(roomName);
                });
            }
        }
    }, 500);

    // ✅ Écoute le clic sur "Arrêter l'enregistrement"
    setInterval(() => {
        const iframeDocument = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (!iframeDocument) return;

        const stopRecordingButton = iframeDocument.getElementById("modal-dialog-ok-button");
        const stopRecordingDiv = iframeDocument.getElementById("dialog-title");

        if (
            stopRecordingButton &&
            stopRecordingDiv &&
            stopRecordingDiv.textContent.includes("Enregistrement")
        ) {
            if (!stopRecordingButton.dataset.listenerAdded) {
                stopRecordingButton.dataset.listenerAdded = "true";
                stopRecordingButton.addEventListener("click", () => {
                    console.log("[Local] Arrêt de l'enregistrement détecté");
                    isLocalStopClicked = true;
                });
            }
        }
    }, 500);

    api.on('recordingStatusChanged', (event: any) => {
        const isRecordingOn = event.on;
        const error = event.error;

        console.info("Changement de statut d'enregistrement :", event);

        if (isRecordingOn) {
            console.info("Enregistrement démarré");
            isRecordingStarted = true;

        } else if (error) {
            console.error(`Erreur d'enregistrement : ${error}`);

        } else if (isRecordingStarted) {
            console.info("Enregistrement arrêté");
            if (isLocalStopClicked) {
                showLoadingToast("Upload de l'enregistrement en cours ...");
                isLocalStopClicked = false;
            }

            if (!checkVideoInterval) {
                checkVideoInterval = setInterval(() => {
                    console.log("Vérification en cours du statut du replay...");
                    checkVideo(roomName, checkVideoInterval, checkTimeout);
                }, 1000);

                checkTimeout = setTimeout(() => {
                    clearInterval(checkVideoInterval as NodeJS.Timeout);
                    checkVideoInterval = null;
                    checkTimeout = null;
                    Swal.fire({
                        title: 'Erreur !',
                        text: `Une erreur est survenue lors de l'enregistrement de la vidéo. Veuillez contacter le support.`,
                        icon: 'error',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        showCloseButton: true
                    });
                }, REPLAY_CHECK_TIMEOUT_MS); // 10 min
            }
        }
    });
};

export const handlejibriApitechApi = (jitsiAPIOptions: any, enableJibriApitechApi: string, jibriApitechApiDomain: string) => {
    console.log(`enableJibriApitechApi=${enableJibriApitechApi}`);
    console.log(`jibriApitechApiDomain=${jibriApitechApiDomain}`);

    if (
        enableJibriApitechApi &&
        enableJibriApitechApi === "true" &&
        jibriApitechApiDomain
    ) {

        let eventId = jitsiAPIOptions.eventId;
        let roomName = jitsiAPIOptions.roomName;
        let uploadCallbackJwt = jitsiAPIOptions.uploadCallbackJwt;
        let uploadCallbackUrl = jitsiAPIOptions.uploadCallbackUrl;
        let uploadCallbackDomainUrl = jitsiAPIOptions.uploadCallbackDomainUrl;

        if (!eventId || !roomName || !uploadCallbackJwt) {
            console.warn("Certains paramètres pour register_eventid sont manquants.");
            return;
        }

        const jibriUrl = `${jibriApitechApiDomain}/visioreplay/register_eventid/${roomName}?eventid=${eventId}&jwt=${uploadCallbackJwt}&uploadcallbackdomainurl=${uploadCallbackDomainUrl}&uploadcallbackurl=${uploadCallbackUrl}`;

        // const xmlHttp = new XMLHttpRequest();
        // xmlHttp.onreadystatechange = function () {
        //     if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        //         console.log("Jibri API Response:", xmlHttp.responseText);
        //     }
        // };
        // xmlHttp.open("GET", jibriUrl, true);
        // xmlHttp.send(null);

        fetch(jibriUrl)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                return res.text();
            })
            .then((text) => {
                console.log("Jibri API Response:", text);
            })
            .catch((err) => {
                console.error("Erreur API Jibri :", err);
            });
    }
};