import { Module } from '@nestjs/common';
import { ReplayService } from './replay.service';
import { ReplayController } from './replay.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Replay as ReplayEntity } from './entities/replay.entity';
import { RegisterEvent as RegisterEventEntity } from './entities/register_event.entity';
import { Conference } from '../conference/entities/conference.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReplayEntity, RegisterEventEntity, Conference]),
  ],
  providers: [ReplayService],
  controllers: [ReplayController],
  exports: [ReplayService],
})
export class ReplayModule { }
