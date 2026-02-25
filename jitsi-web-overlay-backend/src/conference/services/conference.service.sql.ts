import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { ProsodyRuntimeService } from '../../prosody/prosody-runtime.service';
import { JitsiJwtService } from '../../common/services/jitsi-jwt.service';
import { ParticipantService } from '../../participant/participant.service';
import { Participant } from '../../participant/entities/participant.entity';
import { TenantIsolationService } from '../../common/services/tenant-isolation.service';
import { ClientService } from '../../reseller/services/client.service';

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
    private readonly jitsiJwtService: JitsiJwtService,
    private readonly tenantIsolation: TenantIsolationService,
    private readonly clientService: ClientService,
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

    // check if there is already an active conference for this room
    let existingQuery = this.conferenceRepo.createQueryBuilder('conference')
      .where('conference.room_uid = :room_uid', { room_uid: room.uid })
      .andWhere('conference.status = :status', { status: ConferenceStatus.STARTED })
      .andWhere('conference.end_time IS NULL')
      .orderBy('conference.start_time', 'DESC')
      .leftJoinAndSelect('conference.room', 'room');

    // Apply multi-tenant filter
    this.tenantIsolation.applyClientFilter(existingQuery, 'conference');

    const existingConference = await existingQuery.getOne();

    if (existingConference) {
      return existingConference;
    }

    //get offerType
    let offerType: string | null = null;
    if (data.clientId) {
      offerType = await this.clientService.getOfferTypeById(Number(data.clientId));
      console.log('Offer type:', offerType);
    }

    const conf = this.conferenceRepo.create({
      ...data,
      uid: uuidv4(),
      room: room,
      offerTypeAtCreation: offerType as any,
      status: ConferenceStatus.STARTED,
      start_time: new Date(),
    });

    // Inject clientId and offerType (and optionally offerType for audit trail)
    // this.tenantIsolation.injectClientId(conf);
    // this.tenantIsolation.injectOfferType(conf, 'offerTypeAtCreation');

    return this.conferenceRepo.save(conf);
  }

  async findAll(): Promise<Conference[]> {
    const query = this.conferenceRepo.createQueryBuilder('conference')
      .leftJoinAndSelect('conference.participants', 'participants')
      .leftJoinAndSelect('conference.replays', 'replays');

    // Apply multi-tenant filter
    this.tenantIsolation.applyClientFilter(query, 'conference');

    return query.getMany();
  }

  async findOne(uid: string): Promise<Conference> {
    const query = this.conferenceRepo.createQueryBuilder('conference')
      .where('conference.uid = :uid', { uid })
      .leftJoinAndSelect('conference.participants', 'participants')
      .leftJoinAndSelect('conference.replays', 'replays');

    // Apply multi-tenant filter
    this.tenantIsolation.applyClientFilter(query, 'conference');

    const conference = await query.getOne();
    if (!conference) {
      throw new NotFoundException(`Conference with uid ${uid} not found`);
    }

    return conference;
  }


  async findByName(name: string): Promise<Conference | null> {
    const query = this.conferenceRepo.createQueryBuilder('conference')
      .where('conference.name = :name', { name })
      .orderBy('conference.start_time', 'DESC');

    // Apply multi-tenant filter
    this.tenantIsolation.applyClientFilter(query, 'conference');

    const conference = await query.getOne();
    return conference || null;
  }

  async update(
    id: string,
    data: Partial<CreateConferenceDTO>,
  ): Promise<Conference> {
    const conference = await this.findOne(id); // This already validates multi-tenant access
    this.tenantIsolation.validateOwnership(conference, 'conference');

    await this.conferenceRepo.update(+id, data);
    return this.findOne(id);
  }

  async updateEndTimeConferenceByName(confName: string, endTime: Date) {
    const query = this.conferenceRepo.createQueryBuilder('conference')
      .where('conference.name = :name', { name: confName })
      .andWhere('conference.end_time IS NULL')
      .orderBy('conference.start_time', 'DESC');

    // Apply multi-tenant filter
    this.tenantIsolation.applyClientFilter(query, 'conference');

    const conf = await query.getOne();

    if (!conf) {
      throw new NotFoundException(`No active conference found for name: ${confName}`);
    }

    conf.end_time = new Date(endTime);
    conf.status = ConferenceStatus.COMPLETED;
    return this.conferenceRepo.save(conf);
  }

  private async countByDateRange(start: Date, end: Date): Promise<number> {
    const query = this.conferenceRepo.createQueryBuilder('conference')
      .where('conference.start_time BETWEEN :start AND :end', { start, end });

    // Apply multi-tenant filter
    this.tenantIsolation.applyClientFilter(query, 'conference');

    return query.getCount();
  }

  private getDateRangeByFilter(filter: ConferenceFilter): { start: Date; end: Date } {
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

      case ConferenceFilter.WEEK: {
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start = new Date(now);
        start.setDate(now.getDate() + diffToMonday);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }

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

    return { start, end };
  }

  async getStatisticsByFilter(filter: ConferenceFilter): Promise<{ filter: string; total: number }> {
    const { start, end } = this.getDateRangeByFilter(filter);

    const total = await this.countByDateRange(start, end);
    return { filter, total };
  }

  async getGlobalStatistics() {
    // Count total for this client
    const totalQuery = this.conferenceRepo.createQueryBuilder('conference');
    this.tenantIsolation.applyClientFilter(totalQuery, 'conference');
    const total = await totalQuery.getCount();

    return {
      total,
      today: (await this.getStatisticsByFilter(ConferenceFilter.TODAY)).total,
      week: (await this.getStatisticsByFilter(ConferenceFilter.WEEK)).total,
      month: (await this.getStatisticsByFilter(ConferenceFilter.MONTH)).total,
      year: (await this.getStatisticsByFilter(ConferenceFilter.YEAR)).total
    };
  }

  async getHistoricSummary(filter?: ConferenceFilter, start_time?: Date, end_time?: Date) {
    let start: Date | undefined, end: Date | undefined;

    if (filter) {
      ({ start, end } = this.getDateRangeByFilter(filter));

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

  async getAverageParticipants(start?: Date, end?: Date): Promise<number> {
    const query = this.conferenceRepo.createQueryBuilder('conference')
      .where('conference.status = :status', { status: ConferenceStatus.COMPLETED });

    if (start && end) {
      query.andWhere('conference.start_time BETWEEN :start AND :end', { start, end });
    }

    // Apply multi-tenant filter
    this.tenantIsolation.applyClientFilter(query, 'conference');

    query.leftJoinAndSelect('conference.participants', 'participants');
    const conferences = await query.getMany();

    if (conferences.length === 0) return 0;

    const totalParticipants = conferences.reduce(
      (sum, conf) => sum + (conf.participants?.length || 0),
      0,
    );

    const avg = totalParticipants / conferences.length;

    return Number(avg.toFixed(2));
  }

  async getAverageDuration(
    start?: Date,
    end?: Date,
  ): Promise<string> {

    const clientId = this.tenantIsolation.getClientId();

    let query = `
    SELECT AVG(TIMESTAMPDIFF(SECOND, start_time, end_time)) AS avg_seconds
    FROM conferences
    WHERE status = 'completed'
  `;

    const params: any[] = [];
    if (clientId) {
      query += ` AND client_id = ?`;
      params.push(clientId);
    }
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

  async getDuration(uid: string): Promise<string> {
    const conference = await this.findOne(uid); // This already validates multi-tenant access

    const start = conference.start_time;
    const end = conference.end_time ?? new Date();

    const durationMs = end.getTime() - start.getTime();

    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  async getMaxSimultConferences(
    start?: Date,
    end?: Date,
  ): Promise<number> {

    const clientId = this.tenantIsolation.getClientId();

    // Récupération des conférences dans l'intervalle
    let query = `
    SELECT start_time, end_time
    FROM conferences
    WHERE status = 'completed'
  `;
    const params: any[] = [];
    if (clientId) {
      query += ` AND client_id = ?`;
      params.push(clientId);
    }
    if (start && end) {
      query += ` AND start_time <= ? AND end_time >= ?`;
      params.push(end, start);
    }

    const conferences = await this.conferenceRepo.query(query, params);

    const events: { time: Date; type: 'start' | 'end' }[] = [];
    for (const conf of conferences) {
      events.push(
        { time: new Date(conf.start_time), type: 'start' },
        { time: new Date(conf.end_time), type: 'end' },
      );
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

  async getMaxSimultParticipants(start?: Date, end?: Date): Promise<number> {

    if (!start || !end) {
      throw new BadRequestException('Specify start and end date for max simultaneous participants');
    }

    const clientId = this.tenantIsolation.getClientId();

    let query = `
    SELECT p.created_at AS join_time, c.end_time AS leave_time
    FROM participants p
    JOIN conferences c ON c.uid = p.conference_uid
    WHERE p.created_at <= ? AND (c.end_time IS NULL OR c.end_time >= ?)
  `;

    const params: any[] = [end, start];

    if (clientId) {
      query += ` AND c.client_id = ?`;
      params.push(clientId);
    }

    const rows = await this.participantRepo.query(query, params);

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
    // Validate ownership before deleting
    const conference = await this.findOne(id);
    this.tenantIsolation.validateOwnership(conference, 'conference');

    await this.conferenceRepo.delete(+id);
  }

  async roomExists(roomName: string) {
    const exists = await this.prosodyRuntimeService.roomExistsV2(roomName);
    if (exists) return { roomName, active: true };

    throw new NotFoundException("La conférence n'existe pas !");
  }

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

  generateJitsiJwt(user: any, moderator: boolean, roomName: string, isWebinar?: boolean) {

    if (isWebinar && !moderator) {
      // spectateur webinar
      return this.jitsiJwtService.generateWebinarViewerJwt(user, roomName);
    }
    // Speaker or normal user
    return this.jitsiJwtService.generateJitsiJwt(user, moderator, roomName);

  }

  /**
   * Trouver les conférences actives
   * où TOUS les utilisateurs (userUid ≠ null)
   * sont désactivés (isActive = false)
 */
  async findConferencesWithOnlyInactiveUsers(): Promise<string[]> {
    const clientId = this.tenantIsolation.getClientId();

    let query = `
      SELECT c.uid FROM conferences c
      LEFT JOIN participants p ON p.conference_uid = c.uid AND p.user_uid IS NOT NULL
      LEFT JOIN users u ON u.uid = p.user_uid
      WHERE c.is_active = 1
    `;

    const params: any[] = [];

    if (clientId) {
      query += ` AND c.client_id = ?`;
      params.push(clientId);
    }

    query += `
      GROUP BY c.uid
      HAVING SUM(CASE WHEN u.is_active = 1 THEN 1 ELSE 0 END) = 0;
    `;

    const rows = await this.conferenceRepo.query(query, params);

    return rows.map(r => r.uid);
  }

  /**
   * Désactiver toutes les conférences trouvées
   */
  async disableConferences(uids: string[]): Promise<number> {
    if (!uids.length) return 0;

    const clientId = this.tenantIsolation.getClientId();

    let query = this.conferenceRepo
      .createQueryBuilder()
      .update()
      .set({
        isActive: false,
        desactivated_at: () => 'NOW()',
      })
      .where('uid IN (:...uids)', { uids })
      .andWhere('desactivated_at IS NULL');

    // Apply multi-tenant filter to ensure we only disable our own conferences
    if (clientId) {
      query.andWhere('client_id = :clientId', { clientId });
    }

    await query.execute();

    return uids.length;
  }

  /**
   * Fonction principale :
   * Trouver + désactiver
   */
  async disableAllInactiveUserConferences() {
    const uids = await this.findConferencesWithOnlyInactiveUsers();
    const disabledCount = await this.disableConferences(uids);

    return {
      totalDisabled: disabledCount,
      disabledConferences: uids,
    };
  }

  async closeEmptyConferences(): Promise<void> {
    const query = this.conferenceRepo.createQueryBuilder('conference')
      .where('conference.status = :status', { status: ConferenceStatus.STARTED })
      .andWhere('conference.end_time IS NULL');

    // Apply multi-tenant filter
    this.tenantIsolation.applyClientFilter(query, 'conference');

    const activeConfs = await query.getMany();

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

