import { ProsodyModule } from './../prosody/prosody.module';
import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [ProsodyModule],
  providers: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}
