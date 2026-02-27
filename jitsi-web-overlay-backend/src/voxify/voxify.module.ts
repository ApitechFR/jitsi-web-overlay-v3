import { Module } from '@nestjs/common';
import { VoxifyController } from './voxify.controller';
import { VoxifyService } from './voxify.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [VoxifyController],
  providers: [VoxifyService],
  exports: [VoxifyService],
})
export class VoxifyModule { }
