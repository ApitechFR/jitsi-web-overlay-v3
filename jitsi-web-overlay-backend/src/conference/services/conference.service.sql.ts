import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { IConferenceService } from '../interfaces/conference-service.interface';
import { CreateConferenceDTO } from '../DTOs/conference.dto';
import { Conference } from '../entities/conference.entity';
import { ConferenceStatus } from '../enum/conference_status.enum';
import { Room } from '../../room/entities/room.entity';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProsodyService } from '../../prosody/prosody.service';
import { ProsodyRuntimeService } from '../../prosody/prosody-runtime.service';
import { JitsiJwtService } from '../../common/services/jitsi-jwt.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ParticipantService } from '../../participant/participant.service';
import { Participant } from '../../participant/entities/participant.entity';
import { getDateRangeByFilter } from '../../common/utils/GetDateRangeByFilter';
import { DashboardFilter } from '../../common/enum/dashboard_filter.enum';

@Injectable()
export class ConferenceServiceSQL implements IConferenceService {
  private readonly logger = new Logger(ConferenceServiceSQL.name);
  constructor(
    @InjectRepository(Conference)
    private readonly conferenceRepo: Repository<Conference>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(Participant)
    private readonly participantRepo: Repository<Participant>,

    private readonly participantService: ParticipantService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prosodyService: ProsodyService,
    private readonly prosodyRuntimeService: ProsodyRuntimeService,
    private readonly jitsiJwtService: JitsiJwtService
  ) { }

  /**
  * creation d'une conférence si elle n'existe pas déjà en actif pour la salle
  * @param data
  * @returns Conference
  */
  async create(data: CreateConferenceDTO): Promise<Conference> {

    let room = await this.roomRepo.findOne({ where: { uid: data.room_uid } });

    if (!room) {
      room = this.roomRepo.create({
        uid: data.room_uid,
        name: data.name
      });
      await this.roomRepo.save(room);
    }

    // check if there is already an active conference for this room
    const existingConference = await this.conferenceRepo.findOne({
      where: {
        room: { uid: room.uid },
        status: ConferenceStatus.STARTED,
        end_time: null,
      },
      relations: ['room'],
      order: {
        start_time: 'DESC',
      },
    });

    if (existingConference) {
      return existingConference;
    }

    const conf = this.conferenceRepo.create({
      ...data,
      uid: uuidv4(),
      room: room,
      status: ConferenceStatus.STARTED,
      start_time: new Date(),
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


  async findByName(name: string): Promise<Conference | null> {
    return await this.conferenceRepo.findOne({
      where: { name },
      order: { start_time: 'DESC' },
    });
  }

  async update(
    id: string,
    data: Partial<CreateConferenceDTO>,
  ): Promise<Conference> {
    await this.conferenceRepo.update(+id, data);
    return this.findOne(id);
  }

  /**
   * Met à jour l'end_time de la conférence active correspondant au nom donné.
   * @param confName Le nom de la conférence à mettre à jour.
   * @param endTime La nouvelle date de fin de la conférence.
   * @returns La conférence mise à jour.
   * @throws NotFoundException Si aucune conférence active n'est trouvée pour le nom donné.
   */
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

  /**
   * Compte le nombre de conférences dans une plage de dates donnée.
   * @param start La date de début de la plage.
   * @param end La date de fin de la plage.
   * @returns Le nombre de conférences dans la plage de dates.
   */
  private async countByDateRange(start: Date, end: Date): Promise<number> {
    return this.conferenceRepo.count({
      where: { start_time: Between(start, end) }
    });
  }

  /**
   * Récupère les statistiques de conférences selon un filtre de Dashboard.
   * @param filter Le filtre de Dashboard (aujourd'hui, semaine, mois, année).
   * @returns Un objet contenant le filtre et le total des conférences.
   */
  async getStatisticsByFilter(filter: DashboardFilter): Promise<{ filter: string; total: number }> {
    const { start, end } = getDateRangeByFilter(filter);

    const total = await this.countByDateRange(start, end);
    return { filter, total };
  }

  /**
   * Récupère les statistiques globales des conférences.
   * @returns Un objet contenant le total des conférences et les totaux pour aujourd'hui, cette semaine, ce mois et cette année.
   */
  async getGlobalStatistics() {
    return {
      total: await this.conferenceRepo.count(),
      today: (await this.getStatisticsByFilter(DashboardFilter.TODAY)).total,
      week: (await this.getStatisticsByFilter(DashboardFilter.WEEK)).total,
      month: (await this.getStatisticsByFilter(DashboardFilter.MONTH)).total,
      year: (await this.getStatisticsByFilter(DashboardFilter.YEAR)).total
    };
  }

  /**
   * Récupère le résumé historique des conférences selon un filtre ou une plage de dates.
   * @param filter Le filtre de Dashboard (optionnel).
   * @param start_time La date de début de la plage (optionnelle).
   * @param end_time La date de fin de la plage (optionnelle).
   * @returns Un objet contenant diverses statistiques sur les conférences.
   */
  async getHistoricSummary(filter?: DashboardFilter, start_time?: Date, end_time?: Date) {
    let start: Date | undefined, end: Date | undefined;

    if (filter) {
      ({ start, end } = getDateRangeByFilter(filter));

    } else if (start_time && end_time) {
      start = new Date(start_time);
      end = new Date(end_time);
    }

    const confNb = await this.countByDateRange(start, end);
    const maxSimult = await this.getMaxSimultConferences(start, end);
    const confMoyTime = await this.getAverageDuration(start, end);
    const confMoyPart = await this.getAverageParticipants(start, end);
    const users = await this.participantService.countParticipantsByDateRange(start, end);
    const partMaxSimult = await this.getMaxSimultParticipants(start, end);

    return { confNb, maxSimult, confMoyTime, confMoyPart, users, partMaxSimult };
  }

  /**
   * Calcule le nombre moyen de participants par conférence dans une plage de dates donnée.
   * @param start La date de début de la plage (optionnelle).
   * @param end La date de fin de la plage (optionnelle).
   * @returns Le nombre moyen de participants par conférence.
   */
  async getAverageParticipants(start?: Date, end?: Date): Promise<number> {
    const conferences = await this.conferenceRepo.find({
      where: {
        status: ConferenceStatus.COMPLETED,
        ...(start && end ? { start_time: Between(start, end) } : {}),
      },
      relations: ['participants'],
    });

    if (conferences.length === 0) return 0;

    const totalParticipants = conferences.reduce(
      (sum, conf) => sum + (conf.participants?.length || 0),
      0,
    );

    const avg = totalParticipants / conferences.length;

    return Number(avg.toFixed(2));
  }

  /**
   * Calcule la durée moyenne des conférences dans une plage de dates donnée.
   * @param start La date de début de la plage (optionnelle).
   * @param end La date de fin de la plage (optionnelle).
   * @returns La durée moyenne des conférences au format HH:MM:SS.
   */
  async getAverageDuration(
    start?: Date,
    end?: Date,
  ): Promise<string> {


    let query = `
    SELECT AVG(TIMESTAMPDIFF(SECOND, start_time, end_time)) AS avg_seconds
    FROM conferences
    WHERE status = 'completed'
  `;

    const params: any[] = [];
    if (start && end) {
      query += ` AND start_time BETWEEN ? AND ?`;
      params.push(start, end);
    }

    const result = await this.conferenceRepo.query(query, params);

    const avgSeconds = Math.floor(result[0]?.avg_seconds || 0);
    const hours = Math.floor(avgSeconds / 3600);
    const minutes = Math.floor((avgSeconds % 3600) / 60);
    const seconds = avgSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  /**
   * Récupère la durée d'une conférence donnée par son UID.
   * @param uid L'UID de la conférence.
   * @returns La durée de la conférence au format HH:MM:SS.
   */
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

  /**
   * Calcule le nombre maximum de conférences simultanées dans une plage de dates donnée.
   * @param start La date de début de la plage (optionnelle).
   * @param end La date de fin de la plage (optionnelle).
   * @returns Le nombre maximum de conférences simultanées.
   */
  async getMaxSimultConferences(
    start?: Date,
    end?: Date,
  ): Promise<number> {

    // Récupération des conférences dans l'intervalle
    let query = `
    SELECT start_time, end_time
    FROM conferences
    WHERE status = 'completed'
  `;
    const params: any[] = [];
    if (start && end) {
      query += ` AND start_time <= ? AND end_time >= ?`;
      params.push(end, start);
    }

    const conferences = await this.conferenceRepo.query(query, params);

    const events: { time: Date; type: 'start' | 'end' }[] = [];
    for (const conf of conferences) {
      events.push({ time: new Date(conf.start_time), type: 'start' });
      events.push({ time: new Date(conf.end_time), type: 'end' });
    }

    events.sort((a, b) => a.time.getTime() - b.time.getTime() || (a.type === 'end' ? -1 : 1));

    let simult = 0;
    let maxsimult = 0;
    for (const event of events) {
      if (event.type === 'start') {
        simult++;
        if (simult > maxsimult) maxsimult = simult;
      } else {
        simult--;
      }
    }

    return maxsimult;
  }

  /**
   * Calcule le nombre maximum de participants simultanés dans une plage de dates donnée.
   * @param start La date de début de la plage.
   * @param end La date de fin de la plage.
   * @returns Le nombre maximum de participants simultanés.
   */
  async getMaxSimultParticipants(start?: Date, end?: Date): Promise<number> {

    if (!start || !end) {
      throw new BadRequestException('Specify start and end date for max simultaneous participants');
    }

    const query = `
    SELECT p.created_at AS join_time, c.end_time AS leave_time
    FROM participants p
    JOIN conferences c ON c.uid = p.conference_uid
    WHERE p.created_at <= ? AND (c.end_time IS NULL OR c.end_time >= ?)
  `;

    const rows = await this.participantRepo.query(query, [end, start]);

    if (!rows.length) return 0;

    const events: { time: Date; type: "join" | "leave" }[] = [];

    for (const r of rows) {
      events.push({ time: new Date(r.join_time), type: "join" });

      if (r.leave_time) {
        events.push({ time: new Date(r.leave_time), type: "leave" });
      }
    }

    events.sort(
      (a, b) =>
        a.time.getTime() - b.time.getTime() ||
        (a.type === "leave" ? -1 : 1)
    );

    let simult = 0;
    let maxSimult = 0;

    for (const ev of events) {
      if (ev.type === "join") {
        simult++;
        if (simult > maxSimult) maxSimult = simult;
      } else {
        simult--;
      }
    }

    return maxSimult;
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

  /**
   * Récupère le nombre de participants dans une salle donnée.
   * @param roomName Le nom de la salle.
   * @returns Le nombre de participants dans la salle.
   */
  async getRoomSize(roomName: string) {
    return this.prosodyRuntimeService.getRoomSizeV2(roomName);
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

  generateJitsiJwt(user: any, moderator: boolean, roomName: string) {
    return this.jitsiJwtService.generateJitsiJwt(user, moderator, roomName);
  }

  /**
  * Cron job : toutes les minutes, on vérifie les conférences actives.
  * Si participants = 0, on met end_time et on termine la conférence.
  */
  @Cron(CronExpression.EVERY_MINUTE)
  async closeEmptyConferences() {
    const activeConfs = await this.conferenceRepo.find({
      where: {
        status: ConferenceStatus.STARTED,
        end_time: null,
      },
    });

    if (activeConfs.length === 0) {
      return;
    }

    await Promise.all(
      activeConfs.map(async (conf) => {
        try {
          const participants = await this.getRoomSize(conf.name);

          if (participants === 0) {
            this.logger.log(
              `Clôture auto de la conférence ${conf.uid} (${conf.name}) car 0 participants.`,
            );

            conf.end_time = new Date();
            conf.status = ConferenceStatus.COMPLETED;
            await this.conferenceRepo.save(conf);
          }
        } catch (err) {
          this.logger.error(
            `Erreur lors du check de la conférence ${conf.uid} (${conf.name})`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }),
    );
  }
}

