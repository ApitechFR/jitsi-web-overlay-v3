import { HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Replay } from './entities/replay.entity';
import { CreateReplayDto, UpdateReplayDto } from './DTOs/replay.dto';
import { join } from 'path';
import * as path from 'path';
import * as fs from 'fs';
import { RegisterEvent } from './entities/register_event.entity';
import { RegisterEventDto } from './DTOs/register_event.dto';
import { Conference } from '../conference/entities/conference.entity';
import { ReplayStatus } from './enum/replay_status.enum';
import { safeStatFile } from './utils/FileVerification';
import { WinstonLoggerService } from '../common/services/winston-logger.service';
import { ParticipantService } from '../participant/participant.service';

@Injectable()
export class ReplayService {
    private readonly logger = new Logger(ReplayService.name);
    constructor(
        @InjectRepository(Replay)
        private readonly replayRepository: Repository<Replay>,
        @InjectRepository(RegisterEvent)
        private readonly registerEventRepository: Repository<RegisterEvent>,
        @InjectRepository(Conference)
        private readonly conferenceRepository: Repository<Conference>,
        private readonly dataSource: DataSource,
        private readonly loggerWinston: WinstonLoggerService,
        private readonly participantService: ParticipantService
    ) { }

    async findAll(): Promise<Replay[]> {
        return this.replayRepository.find({
            where: {
                status: ReplayStatus.TERMINATED,
            },
            order: {
                created_at: 'DESC',
            },
            relations: ['conference'],
        });
    }

    async findReplayByUID(uid: string) {
        return this.replayRepository.findOne({ where: { uid } });
    }

    async findByLatestConferenceUID(conference_uid: string): Promise<Replay[]> {
        try {
            return await this.replayRepository.find({
                where: {
                    status: ReplayStatus.TERMINATED,
                    conference: { uid: conference_uid },
                },
                relations: ['conference'],
                order: {
                    created_at: 'DESC',
                },
            });
        } catch (error) {
            this.logger.error('Error fetching replays by conference UID:', error);
            throw new InternalServerErrorException('Could not fetch replays for the specified conference.');
        }
    }

    async createReplay(data: CreateReplayDto): Promise<Replay> {
        try {
            return await this.dataSource.transaction(async (manager) => {
                const conference = await manager.findOne(Conference, {
                    where: { name: data.conference_name },
                    order: { created_at: 'DESC' },
                    lock: { mode: 'pessimistic_write' },
                });

                const existingReplay = await manager.findOne(Replay, {
                    where: {
                        conference_name: data.conference_name,
                        status: data.status,
                        uid: null,
                    },
                    order: { created_at: 'DESC' },
                });

                if (existingReplay) {
                    return existingReplay;
                }

                const replay = manager.create(Replay, {
                    status: ReplayStatus.STARTED,
                    message: data.message,
                    conference_name: data.conference_name,
                    conference: conference ?? null,
                });

                return await manager.save(replay);
            });
        } catch (error) {
            this.logger.error('Error inserting replay:', error);
            throw error;
        }
    }

    async updateReplayByConfName(conference_name: string, data: UpdateReplayDto): Promise<Replay> {
        try {
            const replay = await this.replayRepository.findOne({
                where: {
                    status: ReplayStatus.STARTED,
                    uid: null,
                    conference_name: conference_name,
                },
                order: {
                    created_at: 'DESC',
                },
            });

            if (!replay) {
                throw new NotFoundException('Replay not found for this conference.');
            }

            replay.uid = data.uid;
            replay.file_path = data.file_path ?? replay.file_path;
            replay.status = data.status;
            replay.message = data.message;

            return await this.replayRepository.save(replay);
        } catch (error) {
            this.logger.error('Replay non trouvé ou erreur lors de la mise à jour', error);
            throw error;
        }
    }

    async updateReplayByUID(uid: string, data: UpdateReplayDto): Promise<Replay> {
        try {
            const replay = await this.replayRepository.findOne({ where: { uid } });

            if (!replay) {
                throw new NotFoundException('Replay not found');
            }

            let replay_status = data.status;
            let filePath: string | null = null;

            if (data.file_path && typeof data.file_path === 'string') {
                filePath = join('..', data.file_path);
            }

            const isEnabled = process.env.ENABLE_JIBRI_APITECH_API === 'true';

            if (replay_status === ReplayStatus.UPLOADED_RSYNC && filePath) {
                const { isFile, error } = safeStatFile(filePath);
                if (isFile && !isEnabled) {
                    this.logger.log(`Fichier trouvé à l'emplacement : ${filePath}`);
                    replay_status = ReplayStatus.TERMINATED;
                } else {
                    this.logger.warn(`Le fichier n'existe pas ou n'est pas un fichier : ${filePath}`);
                }
                if (error) {
                    this.logger.error(`Erreur lors de la vérification du fichier : ${error}`);
                }
            }
            replay.status = replay_status;
            replay.message = data.message;
            replay.file_path = data.file_path;

            return await this.replayRepository.save(replay);
        } catch (error) {
            this.logger.error('Erreur lors de la mise à jour du replay :', error);
            throw new InternalServerErrorException(error.message);
        }
    }

    async findReplayByConfName(conference_name: string): Promise<Replay | null> {
        return await this.replayRepository.findOne({
            where: { conference_name },
            order: { created_at: 'DESC' },
            relations: ['conference'],
        });
    }

    async findRegisterEventByConfname(confname: string): Promise<RegisterEvent | null> {
        try {
            const registerEvent = await this.registerEventRepository.findOne({
                where: { confname },
            });

            return registerEvent;
        } catch (error) {
            this.logger.error('Erreur lors de la recherche du registerEvent :', error);
            throw new InternalServerErrorException(error.message);
        }
    }

    async registerEventId(data: RegisterEventDto): Promise<RegisterEvent> {
        const { confname, eventid, jwt, uploadCallbackUrl, uploadCallbackDomainUrl } = data;

        const normalizedUrl = uploadCallbackUrl.startsWith('/') ? uploadCallbackUrl : '/' + uploadCallbackUrl;
        const cleanDomainUrl = uploadCallbackDomainUrl.replace('/', '');

        const existing = await this.registerEventRepository.findOne({ where: { confname } });

        if (existing) {
            existing.eventid = eventid;
            existing.jwt = jwt;
            existing.uploadCallbackUrl = normalizedUrl;
            existing.uploadCallbackDomainUrl = cleanDomainUrl;
            existing.updated_at = new Date();

            return await this.registerEventRepository.save(existing);
        }

        const event = this.registerEventRepository.create({
            confname,
            eventid,
            jwt,
            uploadCallbackUrl: normalizedUrl,
            uploadCallbackDomainUrl: cleanDomainUrl,
        });

        return await this.registerEventRepository.save(event);
    }

    downloadVideoFile(rawPath: string): { path: string; stat: fs.Stats; safeFilename: string; } {
        const decodedPath = decodeURIComponent(rawPath || '').trim();

        const { isFile, stat } = safeStatFile(decodedPath);

        if (!decodedPath || !isFile || !stat) {
            throw new HttpException('Fichier introuvable', HttpStatus.NOT_FOUND);
        }

        const safeFilename = path.basename(decodedPath);

        return { path: decodedPath, stat, safeFilename };
    }

    async deleteReplaysByDeactivatedConferences(date: Date): Promise<{ totalDeleted: number; byConference: { conferenceUid: string; count: number }[]; }> {
        const rows = await this.replayRepository.query(
            `
            SELECT r.conference_uid AS conferenceUid, COUNT(*) AS count
            FROM replay r
            JOIN conferences c ON c.uid = r.conference_uid
            WHERE c.is_active = 0
              AND c.desactivated_at < ?
            GROUP BY r.conference_uid
            `,
            [date],
        );

        if (!rows.length) {
            this.loggerWinston.log('[Retention][Replays] No replays to delete');
            return { totalDeleted: 0, byConference: [] };
        }

        const BATCH_SIZE = 1000;
        let deletedInLoop = 0;
        let totalDeleted = 0;

        do {
            const result = await this.replayRepository.query(
                `
                DELETE r
                FROM replay r
                JOIN conferences c ON c.uid = r.conference_uid
                WHERE c.is_active = 0
                  AND c.desactivated_at < ?
                LIMIT ?
                `,
                [date, BATCH_SIZE],
            );

            deletedInLoop = result.affectedRows ?? 0;
            totalDeleted += deletedInLoop;

        } while (deletedInLoop === BATCH_SIZE);

        return {
            totalDeleted,
            byConference: rows.map(r => ({
                conferenceUid: r.conferenceUid,
                count: Number(r.count),
            })),
        };
    }

    async getReplaysByParticipantEmail(email: string) {
        const conferenceUids = await this.participantService.getConferenceUIDsByEmail(email);

        console.log({conferenceUids});

        if (!conferenceUids?.length) {
            return [];
        }

        const replays = await this.replayRepository
            .createQueryBuilder('r')
            .where('r.conference_uid IN (:...uids)', { uids: conferenceUids })
            .orderBy('r.created_at', 'DESC')
            .getMany();

        return replays.filter(replay => replay.file_path && fs.existsSync(replay.file_path));    
    }
}
