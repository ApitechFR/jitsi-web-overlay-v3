import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { IConferenceService } from '../interfaces/conference-service.interface';
import { CreateConferenceDTO } from '../DTOs/conference.dto';
import { Conference } from '../entities/conference.entity';
import { ProsodyService } from '../../prosody/prosody.service';
import { ConferenceStatus } from '../enum/conference_status.enum';
import { Room } from '../../room/entities/room.entity';
import { v4 as uuidv4 } from 'uuid';
import { ConferenceFilter } from '../enum/conference_filter.enum';

@Injectable()
export class ConferenceServiceSQL implements IConferenceService {
  constructor(
    @InjectRepository(Conference)
    private readonly conferenceRepo: Repository<Conference>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    private readonly prosodyService: ProsodyService,
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

    const conf = this.conferenceRepo.create({
      ...data,
      uid: uuidv4(),
      room: room,
      status: ConferenceStatus.STARTED,
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

  async update(
    id: string,
    data: Partial<CreateConferenceDTO>,
  ): Promise<Conference> {
    await this.conferenceRepo.update(+id, data);
    return this.findOne(id);
  }

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

  private async countByDateRange(start: Date, end: Date): Promise<number> {
    return this.conferenceRepo.count({
      where: { created_at: Between(start, end) }
    });
  }

  async getStatisticsByFilter(filter: ConferenceFilter): Promise<{ filter: string; total: number }> {
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

      case ConferenceFilter.WEEK:
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start = new Date(now);
        start.setDate(now.getDate() + diffToMonday);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;

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

    const total = await this.countByDateRange(start, end);
    return { filter, total };
  }

  async getGlobalStatistics() {
    return {
      total: await this.conferenceRepo.count(),
      today: (await this.getStatisticsByFilter(ConferenceFilter.TODAY)).total,
      week: (await this.getStatisticsByFilter(ConferenceFilter.WEEK)).total,
      month: (await this.getStatisticsByFilter(ConferenceFilter.MONTH)).total,
      year: (await this.getStatisticsByFilter(ConferenceFilter.YEAR)).total
    };
  }

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

  async delete(id: string): Promise<void> {
    await this.conferenceRepo.delete(+id);
  }

  // async roomExists(roomName: string) {
  //   const exists = await this.conferenceRepo.findOne({
  //     where: { name: roomName },
  //   });
  //   if (!exists) throw new Error("La conférence n'existe pas");
  //   return { roomName };
  // }

  async roomExists(roomName: string) {
    const exists = await this.prosodyService.roomExists(roomName);
    console.log({ exists })
    if (exists && exists.length > 0) {
      return { roomName };
    } else {
      throw new NotFoundException("la conférence n'existe pas");
    }
  }
}
