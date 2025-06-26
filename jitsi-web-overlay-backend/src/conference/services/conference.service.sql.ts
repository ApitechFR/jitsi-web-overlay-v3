import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IConferenceService } from '../interfaces/conference-service.interface';
import { CreateConferenceDTO } from '../DTOs/conference.dto';
import { Conference } from '../entities/conference.entity';

@Injectable()
export class ConferenceServiceSQL implements IConferenceService {
    constructor(
        @InjectRepository(Conference)
        private readonly conferenceRepo: Repository<Conference>,
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

    async update(id: string, data: Partial<CreateConferenceDTO>): Promise<Conference> {
        await this.conferenceRepo.update(+id, data);
        return this.findOne(id);
    }

    async delete(id: string): Promise<void> {
        await this.conferenceRepo.delete(+id);
    }

    async roomExists(roomName: string) {
        const exists = await this.conferenceRepo.findOne({ where: { name: roomName } });
        if (!exists) throw new Error("La conférence n'existe pas");
        return { roomName };
    }

}
