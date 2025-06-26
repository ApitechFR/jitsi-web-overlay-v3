import { CreateConferenceDTO } from '../DTOs/conference.dto';


export const IConferenceService = Symbol('IConferenceService');

export interface IConferenceService<T = any> {
    create?(data: CreateConferenceDTO): Promise<T>;
    findAll?(): Promise<T[]>;
    findOne?(id: string): Promise<T | null>;
    delete?(id: string): Promise<void>;
    update?(id: string, data: Partial<CreateConferenceDTO>): Promise<T>;

    //web conf
    getRoomAccessToken?(roomName: string, webconfUserRegion: string, accessToken: string): Promise<any>;
    getRoomTestAccessToken?(roomName: string): Promise<{ roomName: string; jwt?: string } | undefined>;
    roomExists?(roomName: string): Promise<{ roomName: string }>;
    getRoomAccessTokenByEmail?(params: { room: string; email: string; host: string; }): Promise<{ isWhitelisted: boolean; sended: string }>;
    verifyToken?(jwt: string): { jwt: string } | void;
    isInternalUser?(webconfUserRegion: string): boolean;
    sendToken?(roomName: string): { roomName: string; jwt: string };

}
