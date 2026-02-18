import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Repository } from 'typeorm';
import { CreateRoomDTO, UpdateRoomDTO } from './DTOs/room.dto';
import { v4 as uuidv4 } from 'uuid';
import { TenantIsolationService } from '../common/services/tenant-isolation.service';

@Injectable()
export class RoomService {

    constructor(
        @InjectRepository(Room)
        private readonly roomRepo: Repository<Room>,
        private readonly tenantIsolation: TenantIsolationService,
    ) { }

    async create(data: CreateRoomDTO): Promise<Room> {

        const query = this.roomRepo.createQueryBuilder('room')
            .where('room.name = :name', { name: data.name });

        // Apply multi-tenant filter
        this.tenantIsolation.applyClientFilter(query, 'room');

        const existing = await query.getOne();
        if (existing) return existing;

        const room = this.roomRepo.create({
            ...data,
            uid: uuidv4(),
        });

        // Inject clientId
        this.tenantIsolation.injectClientId(room);

        return this.roomRepo.save(room);
    }

    async findAll(): Promise<Room[]> {
        const query = this.roomRepo.createQueryBuilder('room')
            .leftJoinAndSelect('room.conferences', 'conferences');

        // Apply multi-tenant filter
        this.tenantIsolation.applyClientFilter(query, 'room');

        return query.getMany();
    }

    async findOne(uid: string): Promise<Room> {
        const query = this.roomRepo.createQueryBuilder('room')
            .where('room.uid = :uid', { uid })
            .leftJoinAndSelect('room.conferences', 'conferences');

        // Apply multi-tenant filter
        this.tenantIsolation.applyClientFilter(query, 'room');

        const room = await query.getOne();
        if (!room) {
            throw new NotFoundException(`Room with ID ${uid} not found`);
        }
        return room;
    }

    async updateByUid(uid: string, updateDto: UpdateRoomDTO): Promise<Room> {
        const room = await this.findOne(uid); // This already validates multi-tenant access
        this.tenantIsolation.validateOwnership(room, 'room');

        Object.assign(room, updateDto); // merge les données du DTO dans la room existante
        return this.roomRepo.save(room);
    }

    async findByRoomName(name: string): Promise<Room> {
        const query = this.roomRepo.createQueryBuilder('room')
            .where('room.name = :name', { name })
            .leftJoinAndSelect('room.conferences', 'conferences');

        // Apply multi-tenant filter
        this.tenantIsolation.applyClientFilter(query, 'room');

        return (await query.getOne()) ?? null;
    }
}
