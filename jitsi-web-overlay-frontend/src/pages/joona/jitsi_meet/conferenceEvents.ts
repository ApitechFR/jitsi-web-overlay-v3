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
    console.log("start time : ", startTime)
    const endTimeFirst = new Date();
    const payload = {
        name: roomName,
        start_time: startTime.toISOString(),
        end_time: endTimeFirst.toISOString(),
        created_by: uuidv4(),
    };
    console.log({ payload })

    const roomExists = await checkRoomExists(roomName);
    if (!roomExists) {
        try {
            console.log("before fetch")
            const response = await fetch(`${API_BASE_URL}/conferences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP ! statut : ${response.status}`);
            }

            console.log("after fetch");
            console.log({ response });
            return await response.json();;
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