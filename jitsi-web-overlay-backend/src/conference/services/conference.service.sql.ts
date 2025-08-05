import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
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
  constructor(
    @InjectRepository(Conference)
    private readonly conferenceRepo: Repository<Conference>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prosodyService: ProsodyService,
  ) {}

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
}
