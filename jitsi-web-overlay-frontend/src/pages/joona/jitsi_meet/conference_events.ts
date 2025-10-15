import { getCachedRuntimeConfig } from '../../../config/runtimeConfig';

function getApiBaseUrl() {
    return getCachedRuntimeConfig()?.VITE_API_URL || '/api';
}

export const getParicipantsNumber = async (roomName: string) => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/conferences/${roomName}/room-size`);
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
    }
};

export const checkConferenceEnd = async (roomName: string) => {
    const endTime = new Date();

    try {
        await fetch(`${getApiBaseUrl()}/conferences/confname/${roomName}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ end_time: endTime.toISOString() }),
        });
    } catch (error) {
        console.error('Erreur lors du mise a jour de la conference :', error);
    }
}

export const createRoom = async (roomName: string) => {
    const roomExists = await getRoomByName(roomName);
    if (roomExists) {
        console.info("La room existe déjà");
        return roomExists;
    }

    const roomPayload = { name: roomName };

    const roomResponse = await fetch(`${getApiBaseUrl()}/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomPayload),
    });

    if (!roomResponse.ok) {
        throw new Error(`Erreur lors de la création de la room : ${roomResponse.status}`);
    }

    const newRoom = await roomResponse.json();
    console.info("Nouvelle room créée :");
    return newRoom;
}

export const createConference = async (roomName: string) => {

    const room = await createRoom(roomName);

    const payload = {
        room_uid: room.uid,
        name: roomName,
    };

    const conferenceResponse = await fetch(`${getApiBaseUrl()}/conferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!conferenceResponse.ok) {
        throw new Error(`Erreur HTTP ! statut : ${conferenceResponse.status}`);
    }

    return await conferenceResponse.json();;
}

export const getRoomByName = async (roomName: string) => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/room/name/${encodeURIComponent(roomName)}`);
        if (response.ok) {
            const room = await response.json();
            return room;
        }
        return null;
    } catch (error) {
        console.error("Erreur réseau :", error);
        return null;
    }
}

export const checkConferenceExists = async (roomName: string) => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/conferences/${encodeURIComponent(roomName)}/state`);

        if (response.ok) {
            console.info("La conférence existe déjà.");
            return true;
        } else {
            console.error("Erreur inattendue :", response.status);
            return false;
        }
    } catch (error) {
        console.error("Erreur réseau :", error);
        return false;
    }
}