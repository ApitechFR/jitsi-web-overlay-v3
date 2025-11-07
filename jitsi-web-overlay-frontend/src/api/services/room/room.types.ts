export interface Room {
    uid: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface CreateRoomPayload {
    name: string;
    created_by: string;
}