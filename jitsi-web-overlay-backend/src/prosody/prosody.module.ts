import { Module } from '@nestjs/common';
import { ProsodyService } from './prosody.service';
import { HttpModule } from '@nestjs/axios';


import { ProsodyRuntimeService } from './prosody-runtime.service';
import { JitsiJwtService } from '../common/services/jitsi-jwt.service';

@Module({
  imports: [HttpModule],
  providers: [ProsodyService, ProsodyRuntimeService, JitsiJwtService],
  exports: [ProsodyService, ProsodyRuntimeService],
})
export class ProsodyModule { }
