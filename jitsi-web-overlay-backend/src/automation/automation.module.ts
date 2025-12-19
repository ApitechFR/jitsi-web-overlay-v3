import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conference } from '../conference/entities/conference.entity';
import { Room } from '../room/entities/room.entity';
import { User } from '../users/entities/users.entity';
import { Participant } from '../participant/entities/participant.entity';
import { Replay } from '../replay/entities/replay.entity';
import { RegisterEvent } from '../replay/entities/register_event.entity';

import { UsersModule } from '../users/users.module';
import { ReplayModule } from '../replay/replay.module';
import { ConferenceModule } from '../conference/conference.module';
import { HttpModule } from '@nestjs/axios';
import { ProsodyModule } from '../prosody/prosody.module';
import { RoomModule } from '../room/room.module';
import { ParticipantModule } from '../participant/participant.module';


@Module({
  imports: [
    ConferenceModule,
    HttpModule,
    ProsodyModule,
    RoomModule,
    ParticipantModule,
    UsersModule,
    ReplayModule,
    TypeOrmModule.forFeature([Conference, Participant, Replay, User, Room, RegisterEvent]),
  ],
  providers: [
    AutomationService,
  ]
})
export class AutomationModule { }
