import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Repository } from 'typeorm';
import { CreateRoomDTO, UpdateRoomDTO } from './DTOs/room.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomService {

    constructor(
        @InjectRepository(Room)
        private readonly roomRepo: Repository<Room>,
    ) { }

    async create(data: CreateRoomDTO): Promise<Room> {

        const existing = await this.roomRepo.findOne({ where: { name: data.name } });
        if (existing) return existing;

        const room = this.roomRepo.create({
            ...data,
            uid: uuidv4(),
        });
        return this.roomRepo.save(room);
    }

    async findAll(): Promise<Room[]> {
        return this.roomRepo.find({ relations: ['conferences'] });
    }

    async findOne(uid: string): Promise<Room> {
        const room = await this.roomRepo.findOne({ where: { uid }, relations: ['conferences'] });
        if (!room) {
            throw new NotFoundException(`Room with ID ${uid} not found`);
        }
        return room;
    }

    async updateByUid(uid: string, updateDto: UpdateRoomDTO): Promise<Room> {
        const room = await this.roomRepo.findOne({ where: { uid } });

        if (!room) {
            throw new NotFoundException(`Room with UID ${uid} not found`);
        }

        Object.assign(room, updateDto); // merge les données du DTO dans la room existante
        return this.roomRepo.save(room);
    }
}
