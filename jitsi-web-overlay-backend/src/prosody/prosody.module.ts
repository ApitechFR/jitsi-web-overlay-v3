import { Module } from '@nestjs/common';
import { ProsodyService } from './prosody.service';
import { HttpModule } from '@nestjs/axios';


import { ProsodyRuntimeService } from './prosody-runtime.service';

@Module({
  imports: [HttpModule],
  providers: [ProsodyService, ProsodyRuntimeService],
  exports: [ProsodyService, ProsodyRuntimeService],
})
export class ProsodyModule { }
