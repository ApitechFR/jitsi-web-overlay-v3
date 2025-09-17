import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { IConferenceService } from '../interfaces/conference-service.interface';
import { CreateConferenceDTO } from '../DTOs/conference.dto';
import { Conference } from '../entities/conference.entity';
import { ConferenceStatus } from '../enum/conference_status.enum';
import { Room } from '../../room/entities/room.entity';
import { v4 as uuidv4 } from 'uuid';
import { ConferenceFilter } from '../enum/conference_filter.enum';
import * as moment from 'moment';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProsodyService } from '../../prosody/prosody.service';
import { ProsodyRuntimeService } from './prosody-runtime.service';
import { InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class ConferenceServiceSQL implements IConferenceService {
  private readonly logger = new Logger(ConferenceServiceSQL.name);
  constructor(
    @InjectRepository(Conference)
    private readonly conferenceRepo: Repository<Conference>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prosodyService: ProsodyService,
    private readonly prosodyRuntimeService: ProsodyRuntimeService
  ) { }

  async create(data: CreateConferenceDTO): Promise<Conference> {

    let room = await this.roomRepo.findOne({ where: { uid: data.room_uid } });

    if (!room) {
      room = this.roomRepo.create({
        uid: data.room_uid,
        name: data.name
      });
      await this.roomRepo.save(room);
    }

    const conf = this.conferenceRepo.create({
      ...data,
      uid: uuidv4(),
      room: room,
      status: ConferenceStatus.STARTED,
    });
    return this.conferenceRepo.save(conf);
  }

  async findAll(): Promise<Conference[]> {
    return this.conferenceRepo.find({ relations: ['participants', 'replays'] });
  }

  async findOne(uid: string): Promise<Conference> {
    return this.conferenceRepo.findOne({
      where: { uid },
      relations: ['participants', 'replays'],
    });
  }

  async update(
    id: string,
    data: Partial<CreateConferenceDTO>,
  ): Promise<Conference> {
    await this.conferenceRepo.update(+id, data);
    return this.findOne(id);
  }

  async updateEndTimeConferenceByName(confName: string, endTime: Date) {
    const conf = await this.conferenceRepo.findOne({
      where: { name: confName, end_time: null },
      order: { start_time: 'DESC' },
    });

    if (!conf) {
      throw new NotFoundException(`No active conference found for name: ${confName}`);
    }

    conf.end_time = new Date(endTime);
    conf.status = ConferenceStatus.COMPLETED;
    return this.conferenceRepo.save(conf);
  }

  private async countByDateRange(start: Date, end: Date): Promise<number> {
    return this.conferenceRepo.count({
      where: { created_at: Between(start, end) }
    });
  }

  async getStatisticsByFilter(filter: ConferenceFilter): Promise<{ filter: string; total: number }> {
    const now = new Date();

    let start: Date;
    let end: Date;

    switch (filter) {
      case ConferenceFilter.TODAY:
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;

      case ConferenceFilter.WEEK:
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start = new Date(now);
        start.setDate(now.getDate() + diffToMonday);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;

      case ConferenceFilter.MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case ConferenceFilter.YEAR:
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      default:
        throw new NotFoundException(`Invalid filter: ${filter}`);
    }

    const total = await this.countByDateRange(start, end);
    return { filter, total };
  }

  async getGlobalStatistics() {
    return {
      total: await this.conferenceRepo.count(),
      today: (await this.getStatisticsByFilter(ConferenceFilter.TODAY)).total,
      week: (await this.getStatisticsByFilter(ConferenceFilter.WEEK)).total,
      month: (await this.getStatisticsByFilter(ConferenceFilter.MONTH)).total,
      year: (await this.getStatisticsByFilter(ConferenceFilter.YEAR)).total
    };
  }

  async getDuration(uid: string): Promise<string> {
    const conference = await this.conferenceRepo.findOne({
      where: { uid },
    });

    if (!conference) {
      throw new NotFoundException(`Conference with uid ${uid} not found`);
    }

    const start = conference.start_time;
    const end = conference.end_time ?? new Date();

    const durationMs = end.getTime() - start.getTime();
    //const durationInMinutes = Math.floor(durationMs / 60000);

    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  async delete(id: string): Promise<void> {
    await this.conferenceRepo.delete(+id);
  }

  async roomExists(roomName: string) {
    //const { token } = await this.generateJitsiJwt({ role: 'service' }, true, roomName);

    const exists = await this.prosodyRuntimeService.roomExistsV2(roomName);
    if (exists) return { roomName, active: true };

    throw new NotFoundException("La conférence n'existe pas !");
  }

  // async roomExists(roomName: string) {
  //   const exists = await this.prosodyService.roomExists(roomName);
  //   if (exists && exists.length > 0) {
  //     return { roomName };
  //   }
  //   console.error("La conférence n'existe pas");
  //   throw new NotFoundException("La conférence n'existe pas");
  // }

  async getRoomAccessToken(roomName: string, region: string, token: string) {
    const exists = await this.prosodyService.roomExists(roomName);
    if (exists && exists.length > 0) return { roomName };
    if (!token) {
      throw new UnauthorizedException(
        "Veuillez vous authentifier pour accéder à la webconf de l'État",
      );
    }

    this.verifyToken(token);
    return this.sendToken(roomName);
  }

  verifyToken(jwt: string) {
    try {
      if (jwt && this.jwtService.verify(jwt)) {
        return { jwt };
      }
    } catch (error) {
      console.error("l'accessToken est expiré", error);
      throw new UnauthorizedException("l'accessToken est expiré");
    }
  }

  sendToken(roomName: string) {
    try {
      const jwt = this.jwtService.sign({
        iss: this.configService.get('JITSI_JITSIJWT_ISS'),
        exp: moment()
          .add(this.configService.get('JITSI_JITSIJWT_EXPIRESAFTER'), 'minutes')
          .unix(),
        aud: this.configService.get('JITSI_JITSIJWT_AUD'),
        sub: this.configService.get('JITSI_JITSIJWT_SUB'),
        room: roomName,
      });

      return { roomName, jwt };
    } catch (error) {
      console.log('Erreur lors de la création du jeton jitsi ', error);
      throw new UnauthorizedException(
        'Erreur lors de la création du jeton jitsi ',
        error,
      );
    }
  }

  isUserModerator(user: any, room: string) {
    return true;
  }

  async generateJitsiJwt(user: any, moderator: boolean, roomName: string) {
    try {
      const aud = this.configService.get('JITSI_JITSIJWT_AUD') ?? 'jitsi';
      const iss = this.configService.get('JITSI_JITSIJWT_ISS');
      const sub = this.configService.get('JITSI_JITSIJWT_SUB');
      const minutes = Number(this.configService.get('JITSI_JITSIJWT_EXPIRESAFTER') ?? 60);

      if (!iss || !sub) {
        throw new InternalServerErrorException('Jitsi JWT config missing (iss/sub)');
      }
      if (!minutes || minutes <= 0) {
        throw new InternalServerErrorException('Invalid Jitsi JWT expiration');
      }

      const first = user?.given_name || user?.firstName || user?.prenom || '';
      const last = user?.family_name || user?.lastName || user?.nom || '';
      const full = [first, last].filter(Boolean).join(' ').trim();

      const displayName = full || user?.name || user?.email || 'Invité';
      const email = user?.email || '';

      const now = Math.floor(Date.now() / 1000);
      const exp = now + minutes * 60;
      const nbf = now - 10; // tolérance 10s

      const payload: any = {
        context: {
          user: {
            avatar: user?.avatar ?? '',
            name: displayName,
            email,
            moderator: Boolean(moderator),
          },
        },
        aud, iss, sub,
        room: roomName,
        iat: now,
        nbf,
        exp,
      };

      const secret = this.configService.get('JITSI_JITSIJWT_SECRET');
      let token: string;

      if (secret) {
        token = this.jwtService.sign(payload, {
          secret,
          algorithm: 'HS256',
        });
      } else {
        // Fallback: token pré-signé 
        token = this.configService.get('JITSI_JWT');
        if (!token) {
          throw new InternalServerErrorException('No signing secret or fallback token configured');
        }
      }

      return { token, exp };
    } catch (error) {
      this.logger.error('Erreur lors de la création du token Jitsi', error);
      throw new UnauthorizedException('Impossible de générer le token');
    }
  }
}

