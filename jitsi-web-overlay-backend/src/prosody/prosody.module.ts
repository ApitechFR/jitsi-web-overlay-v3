import { Module } from '@nestjs/common';
import { ProsodyService } from './prosody.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [ProsodyService],
  exports: [ProsodyService],
})
export class ProsodyModule {}
