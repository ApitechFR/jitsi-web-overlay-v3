import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchStats = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/stats/dashboard`);
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
    }
};

export const checkConferenceEnd = async (roomName: string) => {
    const endTime = new Date();
    console.log({ endTime });

    try {
        console.log("before update")
        console.log("end time string : ", endTime.toISOString())
        console.log({ roomName })
        await fetch(`${API_BASE_URL}/conferences/confname/${roomName}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ end_time: endTime.toISOString() }),
        });
        console.log("after update")
    } catch (error) {
        console.error('Erreur lors du mise a jour de la conference :', error);
    }
}

export const createConference = async (roomName: string) => {
    const startTime = new Date();
    console.log("start time : ", startTime);
    const createdBy = uuidv4();

    const roomExists = await checkRoomExists(roomName);
    if (!roomExists) {
        try {
            const roomPayload = {
                name: roomName,
                created_by: createdBy,
            };

            const roomResponse = await fetch(`${API_BASE_URL}/room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomPayload),
            });

            if (!roomResponse.ok) {
                throw new Error(`Erreur lors de la création de la room : ${roomResponse.status}`);
            }

            const room = await roomResponse.json();

            console.log({ room });

            const payload = {
                room_uid: room.uid,
                name: roomName,
                start_time: startTime.toISOString(),
            };
            console.log({ payload })

            console.log("before fetch")
            const conferenceResponse  = await fetch(`${API_BASE_URL}/conferences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!conferenceResponse .ok) {
                throw new Error(`Erreur HTTP ! statut : ${conferenceResponse .status}`);
            }

            console.log("after fetch");
            console.log({ conferenceResponse  });
            return await roomResponse.json();;
        } catch (error) {
            console.error('Erreur lors de la creation de la conference :', error);
        }
    }
}

export const checkRoomExists = async (roomName: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/roomExists/${roomName}`);

        if (response.ok) {
            const data = await response.json();
            console.log("La salle existe :", data);
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