export const ENV = {
    PROSODY_INSTANCES: 'PROSODY_AVAILABLE_INSTANCES',
    JITSI_MUC_DOMAIN: 'JITSI_MUC_DOMAIN',
    PROSODY_DOMAIN: 'PROSODY_DOMAIN', // fallback
    PROSODY_API_PREFIX: 'PROSODY_API_PREFIX',
    EP_ROOM_SIZE: 'PROSODY_ENDPOINT_ROOM_SIZE',
    EP_ROOM: 'PROSODY_ENDPOINT_ROOM',
    EP_SESSIONS: 'PROSODY_ENDPOINT_SESSIONS',
} as const;

export const DEFAULTS = {
    ApiPrefix: '',
    RoomSizePath: '/room-size',
    RoomPath: '/room',
    SessionsPath: '/sessions',
    HttpTimeoutMs: 5000,
} as const;
