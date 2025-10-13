
export interface Conference {
    uid: string;
    name: string;
    room_uid: string;
}

export interface JitsiJwtResponse {
    token: string;            // JWT
    exp?: number;             // timestamp d’expiration (optionnel)
    moderator: boolean;       // rôle accordé par le backend
}