
export interface Conference {
    uid: string;
    name: string;
    room_uid: string;
}

export interface JitsiJwtResponse {
    token: string;            // JWT
    exp?: number;             // timestamp d’expiration (optionnel)
    moderator?: boolean;       // rôle accordé par le backend
    roomName?: string;        // nom de la salle (optionnel)
}

export interface CreateByEmailRes {
    isWhitelisted: boolean;
    error?: string;
}
export interface JoinRes {
    jwt?: string;
    confName?: string;
    error?: string;
    login?: boolean;
}