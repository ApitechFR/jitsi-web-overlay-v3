import { JitsiJwtService } from '../common/services/jitsi-jwt.service';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ConferenceController } from './conference.controller';
import { Conference } from './entities/conference.entity';
import { ProsodyModule } from '../prosody/prosody.module';
import { RoomNameValidator } from '../common/validators/room-name.validator';
import { ConferenceServiceMongo } from './services/conference.service.mongo';
import { ConferenceServiceSQL } from './services/conference.service.sql';
import { IConferenceService } from './interfaces/conference-service.interface';
import {
  WhiteListedDomains,
  WhiteListedDomainsSchema,
} from '../schemas/WhiteListedDomains.schema';
import { Participant } from '../participant/entities/participant.entity';
import { Replay } from '../replay/entities/replay.entity';
import { User } from '../users/entities/users.entity';
import { RoomModule } from '../room/room.module';
import { Room } from '../room/entities/room.entity';
import { ProsodyRuntimeService } from '../prosody/prosody-runtime.service';

@Module({
  imports: [
    HttpModule,
    ProsodyModule,
    RoomModule,
    ...(process.env.DB_TYPE === 'mongodb'
      ? [
        MongooseModule.forFeature([
          { name: WhiteListedDomains.name, schema: WhiteListedDomainsSchema },
        ]),
      ]
      : [TypeOrmModule.forFeature([Conference, Participant, Replay, User, Room])]),
  ],
  controllers: [ConferenceController],
  providers: [
    JitsiJwtService,
    RoomNameValidator,
    ProsodyRuntimeService,
    ...(process.env.DB_TYPE === 'mongodb'
      ? [
        ConferenceServiceMongo,
        {
          provide: IConferenceService,
          inject: [ConferenceServiceMongo, ConfigService],
          useFactory: (mongo: ConferenceServiceMongo) => mongo,
        },
      ]
      : [
        ConferenceServiceSQL,
        {
          provide: IConferenceService,
          useExisting: ConferenceServiceSQL,
        },
      ]),
  ],
  exports: [IConferenceService, ProsodyRuntimeService],
})
export class ConferenceModule { }
