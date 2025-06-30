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

@Module({
  imports: [
    HttpModule,
    ProsodyModule,
    ...(process.env.DB_TYPE === 'mongodb'
      ? [
          MongooseModule.forFeature([
            { name: WhiteListedDomains.name, schema: WhiteListedDomainsSchema },
          ]),
        ]
      : [TypeOrmModule.forFeature([Conference, Participant, Replay, User])]),
  ],
  controllers: [ConferenceController],
  providers: [
    RoomNameValidator,
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
            inject: [ConferenceServiceSQL],
            useFactory: (sql: ConferenceServiceSQL) => sql,
          },
        ]),
  ],
  exports: [IConferenceService],
})
export class ConferenceModule {}
