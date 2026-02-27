import { Module } from '@nestjs/common';
import { ReplayService } from './replay.service';
import { ReplayController } from './replay.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Replay as ReplayEntity } from './entities/replay.entity';
import { RegisterEvent as RegisterEventEntity } from './entities/register_event.entity';
import { Conference } from '../conference/entities/conference.entity';
import { WinstonLoggerService } from '../common/services/winston-logger.service';
import { ParticipantService } from '../participant/participant.service';
import { Participant } from '../participant/entities/participant.entity';
import { User } from '../users/entities/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReplayEntity, RegisterEventEntity, Conference, Participant, User]),
  ],
  providers: [
    ReplayService,
    WinstonLoggerService,
    ParticipantService
  ],
  controllers: [ReplayController],
  exports: [ReplayService],
})
export class ReplayModule { }
