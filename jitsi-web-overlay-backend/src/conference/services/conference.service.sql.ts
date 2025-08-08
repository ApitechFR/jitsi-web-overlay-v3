import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IConferenceService } from '../interfaces/conference-service.interface';
import { CreateConferenceDTO } from '../DTOs/conference.dto';
import { Conference } from '../entities/conference.entity';
import * as moment from 'moment';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProsodyService } from '../../prosody/prosody.service';

@Injectable()
export class ConferenceServiceSQL implements IConferenceService {
  private readonly logger = new Logger(ConferenceServiceSQL.name);
  constructor(
    @InjectRepository(Conference)
    private readonly conferenceRepo: Repository<Conference>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prosodyService: ProsodyService,
  ) { }

  async create(data: CreateConferenceDTO): Promise<Conference> {
    const conf = this.conferenceRepo.create(data);
    return this.conferenceRepo.save(conf);
  }

  async findAll(): Promise<Conference[]> {
    return this.conferenceRepo.find({ relations: ['participants', 'replays'] });
  }

  async findOne(id: string): Promise<Conference> {
    return this.conferenceRepo.findOne({
      where: { id: +id },
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

  async delete(id: string): Promise<void> {
    await this.conferenceRepo.delete(+id);
  }

  async roomExists(roomName: string) {
    const exists = await this.prosodyService.roomExists(roomName);
    if (exists && exists.length > 0) {
      return { roomName };
    }
    console.error("La conférence n'existe pas");
    throw new NotFoundException("La conférence n'existe pas");
  }

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

  generateJitsiJwt(user: any, moderator: boolean, roomName: string) {
    try {
      const aud = this.configService.get('JITSI_JITSIJWT_AUD') ?? 'jitsi';
      const iss = this.configService.get('JITSI_JITSIJWT_ISS');
      const sub = this.configService.get('JITSI_JITSIJWT_SUB');
      const minutes = Number(this.configService.get('JITSI_JITSIJWT_EXPIRESAFTER') ?? 60);


      const payload = {
        context: {
          user: {
            avatar: user?.avatar ?? '',
            name: user?.name ?? 'Moderator',
            email: user?.email ?? 'moderator@apitech.fr',
            moderator: Boolean(moderator),
          },
        },
        aud,
        iss,
        sub,
        room: roomName,
        exp: moment().add(minutes, 'minutes').unix(),
      };

      const secret = this.configService.get('JITSI_JITSIJWT_SECRET');
      let jwt;

      if (secret) {
        jwt = this.jwtService.sign(payload, { secret, noTimestamp: true });
      } else {
        jwt = this.configService.get('JITSI_JWT');
      }

      return { jwt, payload };
    } catch (error) {
      this.logger.error('Erreur lors de la création du jeton jitsi', error);
      throw new UnauthorizedException('Erreur lors de la création du jeton jitsi');
    }
  }
}

