import Swal from "sweetalert2";


export const API_BASE_URL = import.meta.env.VITE_BASE_URL;

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
        const response = await fetch(`${API_BASE_URL}/api/visioreplay/start_recording`, {
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
        const response = await fetch(`${API_BASE_URL}/api/visioreplay/findReplay/${encodeURIComponent(conference_name)}`);
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

export const handleRecordingStatus = (api: any, roomName: string, checkVideoInterval: NodeJS.Timeout | null, checkTimeout: NodeJS.Timeout | null) => {
    let isRecordingStarted = false;

    api.on('recordingStatusChanged', (event: any) => {
        const isRecordingOn = event.on;
        const error = event.error;

        console.info("Changement de statut d'enregistrement :", event);

        if (isRecordingOn) {
            console.info("Enregistrement démarré");
            isRecordingStarted = true;
            startVideo(roomName);

        } else if (error) {
            console.error(`Erreur d'enregistrement : ${error}`);

        } else if (isRecordingStarted) {
            console.info("Enregistrement arrêté");
            showLoadingToast("Upload de l'enregistrement en cours ...");

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
                }, 600000); // 10 min
            }
        }
    });
};