import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Participant } from './entities/participant.entity';
import { Conference } from '../conference/entities/conference.entity';
import { User } from '../users/entities/users.entity';
import { Between, In, Repository } from 'typeorm';
import { CreateParticipantDto, UpdateParticipantDto } from './dto/create-participant.dto';
import { v4 as uuidv4 } from 'uuid';
import { PaginationDto } from './dto/pagination.dto';
import { TenantIsolationService } from '../common/services/tenant-isolation.service';

@Injectable()
export class ParticipantService {
    constructor(
        @InjectRepository(Participant)
        private readonly participantRepo: Repository<Participant>,

        @InjectRepository(Conference)
        private readonly conferenceRepo: Repository<Conference>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        private readonly tenantIsolation: TenantIsolationService,
    ) { }

    /**
     * Helper: Validate that a conference belongs to the current client
     */
    private async validateConferenceOwnership(conferenceUid: string): Promise<Conference> {
        const query = this.conferenceRepo.createQueryBuilder('conference')
            .where('conference.uid = :uid', { uid: conferenceUid });

        // Apply multi-tenant filter
        this.tenantIsolation.applyClientFilter(query, 'conference');

        const conference = await query.getOne();
        if (!conference) {
            throw new NotFoundException('Conférence non trouvée ou accès refusé');
        }

        return conference;
    }

    async create(dto: CreateParticipantDto): Promise<Participant> {
        // Validate conference ownership (this also checks multi-tenant access)
        const conference = await this.validateConferenceOwnership(dto.conferenceUid);

        let user: User | null = null;
        if (dto.userUid) {
            user = await this.userRepo.findOne({ where: { uid: dto.userUid } });
            if (!user) {
                throw new NotFoundException('Utilisateur non trouvé');
            }
        }

        if (dto.email) {
            const existingParticipant = await this.findByEmail(dto.email, dto.conferenceUid);
            if (existingParticipant) {
                return existingParticipant;
            }
        } else if (dto.displayName) {
            const existingParticipant = await this.findByDisplayName(dto.displayName, dto.conferenceUid);
            if (existingParticipant) {
                return existingParticipant;
            }
        }

        const participant = this.participantRepo.create({
            uid: uuidv4(),
            conference,
            user,
            displayName: dto.displayName,
            email: dto.email,
            phone: dto.phone,
            role: dto.role,
            status: dto.status,
            inviteMethod: dto.inviteMethod,
        });

        return await this.participantRepo.save(participant);
    }

    async findByEmail(email: string, conferenceUid: string): Promise<Participant | null> {
        // Validate conference ownership first
        await this.validateConferenceOwnership(conferenceUid);

        return await this.participantRepo.findOne({
            where: {
                email,
                conference: { uid: conferenceUid },
            },
            relations: ['conference', 'user'],
        });
    }

    async findByDisplayName(displayName: string, conferenceUid: string): Promise<Participant | null> {
        // Validate conference ownership first
        await this.validateConferenceOwnership(conferenceUid);

        return await this.participantRepo.findOne({
            where: {
                displayName,
                conference: { uid: conferenceUid },
            },
            relations: ['conference', 'user'],
        });
    }

    async findAll(): Promise<Participant[]> {
        // Get all conferences for the current client
        const conferenceQuery = this.conferenceRepo.createQueryBuilder('conference');
        this.tenantIsolation.applyClientFilter(conferenceQuery, 'conference');
        const conferences = await conferenceQuery.getMany();

        if (conferences.length === 0) {
            return [];
        }

        const conferenceUids = conferences.map(c => c.uid);

        return await this.participantRepo.find({
            where: { conference: { uid: In(conferenceUids) } as any },
            relations: ['conference', 'user'],
        });
    }

    async findOne(uid: string): Promise<Participant> {
        const participant = await this.participantRepo.findOne({
            where: { uid },
            relations: ['conference', 'user'],
        });
        if (!participant) {
            throw new NotFoundException('Participant non trouvé');
        }

        // Validate that the conference belongs to current client
        this.tenantIsolation.validateOwnership(participant.conference, 'conference');

        return participant;
    }

    async update(uid: string, dto: UpdateParticipantDto): Promise<Participant> {
        const participant = await this.findOne(uid); // This already validates multi-tenant access

        Object.assign(participant, dto);

        if (dto.userUid) {
            const user = await this.userRepo.findOne({ where: { uid: dto.userUid } });
            participant.user = user ?? null;
        }

        return await this.participantRepo.save(participant);
    }

    async getParticipantByConfUID(conferenceUid: string, paginationDto: PaginationDto): Promise<{ data: Participant[]; total: number; page: number; pageCount: number; }> {
        const { page = 1, limit = 20 } = paginationDto;

        // Validate conference ownership (also ensures multi-tenant access)
        await this.validateConferenceOwnership(conferenceUid);

        const skip = (page - 1) * limit;

        const [data, total] = await this.participantRepo.findAndCount({
            where: { conference: { uid: conferenceUid } },
            relations: ['user', 'invitedBy', 'sessions'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip,
        });

        return { data, total, page, pageCount: Math.ceil(total / limit) };
    }

    async countParticipantsByDateRange(start: Date, end: Date): Promise<number> {
        // Get all conferences for the current client
        const conferenceQuery = this.conferenceRepo.createQueryBuilder('conference');
        this.tenantIsolation.applyClientFilter(conferenceQuery, 'conference');
        const conferences = await conferenceQuery.getMany();

        if (conferences.length === 0) {
            return 0;
        }

        const conferenceUids = conferences.map(c => c.uid);

        return this.participantRepo.count({
            where: {
                createdAt: Between(start, end),
                conference: { uid: In(conferenceUids) } as any,
            },
        });
    }

    async getConferenceUIDsByEmail(email: string): Promise<string[]> {
        const rows = await this.participantRepo.query(
        `
            SELECT DISTINCT conference_uid
            FROM participants
            WHERE email = ?
        `,
            [email],
        );

        return rows.map(r => r.conference_uid);
    }

}
