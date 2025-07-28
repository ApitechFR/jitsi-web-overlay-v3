import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Replay } from './entities/replay.entity';
import { v4 as uuidv4 } from 'uuid';
import { CreateReplayDto, UpdateReplayDto } from './DTOs/replay.dto';
import { join } from 'path';
import * as fs from 'fs';
import { RegisterEvent } from './entities/register_event.entity';
import { RegisterEventDto } from './DTOs/register_event.dto';
import { Conference } from '../conference/entities/conference.entity';

@Injectable()
export class ReplayService {
    constructor(
        @InjectRepository(Replay)
        private readonly replayRepository: Repository<Replay>,
        @InjectRepository(RegisterEvent)
        private readonly registerEventRepository: Repository<RegisterEvent>,
        @InjectRepository(Conference)
        private readonly conferenceRepository: Repository<Conference>,
        private dataSource: DataSource,
    ) { }

    async findAll(): Promise<Replay[]> {
        return this.replayRepository.find({
            where: {
                status: 'terminated',
            },
            order: {
                created_at: 'DESC',
            },
            relations: ['conference'],
        });
    }

    async findByLatestConferenceUID(conference_uid: string): Promise<Replay[]> {
        return this.replayRepository.find({
            where: {
                status: 'terminated',
                conference: { uid: conference_uid },
            },
            relations: ['conference'],
            order: {
                created_at: 'DESC',
            },
        });
    }

    async createReplay(data: CreateReplayDto): Promise<Replay> {
        try {
            const conference = await this.conferenceRepository.findOne({
                where: { name: data.conference_name },
                order: { created_at: 'DESC' },
            });

            const replay = this.replayRepository.create({
                status: data.status,
                message: data.message,
                conference_name: data.conference_name,
                conference: conference,
            });

            return await this.replayRepository.save(replay);
        } catch (error) {
            console.error('Error inserting replay:', error);
            throw error;
        }
    }

    async updateReplayByConfName(conference_name: string, data: UpdateReplayDto): Promise<Replay> {
        try {
            const replay = await this.replayRepository.findOne({
                where: {
                    status: 'started',
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
            console.error('Replay non trouvé ou erreur lors de la mise à jour', error);
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
            const filePath = join('..', data.file_path || '');
            console.log({ filePath });

            const isEnabled = process.env.ENABLE_JIBRI_APITECH_API === 'true';

            if (replay_status === 'uploaded-rsync' && fs.existsSync(filePath)) {
                console.log('file exist:', true);
                if (!isEnabled) {
                    console.log({ isEnabled });
                    replay_status = 'terminated';
                }
            }

            replay.status = replay_status;
            replay.message = data.message;
            replay.file_path = data.file_path;


            return await this.replayRepository.save(replay);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du replay :', error);
            throw new InternalServerErrorException(error.message);
        }
    }

    async findReplayByConfName(conference_name: string): Promise<Replay | null> {
        return await this.replayRepository.findOne({
            where: { conference_name },
            order: { created_at: 'DESC' },
        });
    }

    async findRegisterEventByConfname(confname: string): Promise<RegisterEvent | null> {
        try {
            const registerEvent = await this.registerEventRepository.findOne({
                where: { confname },
            });

            return registerEvent;
        } catch (error) {
            console.error('Erreur lors de la recherche du registerEvent :', error);
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
}
