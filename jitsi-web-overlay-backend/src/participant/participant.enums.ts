export enum ParticipantRole {
    ATTENDEE = 'ATTENDEE',
    MODERATOR = 'MODERATOR',
    SPEAKER = 'SPEAKER',
    RECORDER = 'RECORDER',
    VISITOR = 'VISITOR',
}

export enum ParticipantStatus {
    INVITED = 'INVITED',
    CONFIRMED = 'CONFIRMED',
    DECLINED = 'DECLINED',
    JOINED = 'JOINED',
    LEFT = 'LEFT',
    BANNED = 'BANNED',
}

export enum InviteMethod {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    LINK = 'LINK',
    API = 'API',
    MANUAL = 'MANUAL',
}
