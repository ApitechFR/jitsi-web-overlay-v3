import { CreateConferenceDTO } from '../DTOs/conference.dto';
import { ConferenceFilter } from '../enum/conference_filter.enum';

export const IConferenceService = Symbol('IConferenceService');

export interface IConferenceService<T = any> {
  getGlobalStatistics?(): Promise<T>;
  getStatisticsByFilter?(filter: string): Promise<T>;
  getDuration?(uid: string): Promise<T>;
  getAverageDuration?(start_time?: Date, end_time?: Date): Promise<T>;
  getMaxSimultConferences?(start_time?: Date, end_time?: Date): Promise<T>;
  getHistoricSummary?(filter?: ConferenceFilter, start?: Date, end?: Date): Promise<T>;
  updateEndTimeConferenceByName?(confName: string, end_time: Date): Promise<T>;
  create?(data: CreateConferenceDTO): Promise<T>;
  findAll?(): Promise<T[]>;
  findOne?(id: string): Promise<T | null>;
  findByName?(name: string): Promise<T | null>;
  delete?(id: string): Promise<void>;
  update?(id: string, data: Partial<CreateConferenceDTO>): Promise<T>;
  activateConference?(uid: string): Promise<T>;

  disableAllInactiveUserConferences?(): Promise<T>;
  closeEmptyConferences?(): Promise<T>;

  //web conf
  getRoomAccessToken?(
    roomName: string,
    webconfUserRegion: string,
    accessToken: string,
  ): Promise<any>;
  getRoomTestAccessToken?(
    roomName: string,
  ): Promise<{ roomName: string; jwt?: string } | undefined>;
  roomExists?(roomName: string): Promise<{ roomName: string }>;
  getRoomSize?(roomName: string): Promise<number>;
  getRoomAccessTokenByEmail?(params: {
    room: string;
    email: string;
    host: string;
  }): Promise<{ isWhitelisted: boolean; sended: string }>;
  verifyToken?(jwt: string): { jwt: string } | void;
  isInternalUser?(webconfUserRegion: string): boolean;
  sendToken?(roomName: string): { roomName: string; jwt: string };
  generateJitsiJwt?(user: any, moderator: boolean, roomName: string): any;
  isUserModerator?(user: any, roomName: string): boolean;
}
