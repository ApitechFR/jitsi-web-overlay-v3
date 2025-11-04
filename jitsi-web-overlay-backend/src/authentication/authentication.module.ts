import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { ConferenceModule } from '../conference/conference.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [HttpModule, ConferenceModule, UsersModule],
  providers: [AuthenticationService],
  controllers: [AuthenticationController],
})
export class AuthenticationModule { }
