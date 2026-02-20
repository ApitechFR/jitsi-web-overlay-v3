import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { ConferenceModule } from '../conference/conference.module';
import { JwtStrategy } from './jwt.strategy';
import { JwtRs256Strategy } from './strategies/jwt-rs256.strategy';
import { UsersModule } from '../users/users.module';
import { ResellerModule } from '../reseller/reseller.module';
import { TenantContext } from '../common/context/tenant.context';

@Module({
  imports: [HttpModule, ConferenceModule, UsersModule, ResellerModule],
  providers: [
    AuthenticationService,
    JwtStrategy,
    // JWT RS256 Strategy for multi-tenant authentication
    // The strategy will handle conditional mode checking internally
    // If RESELLER_MODE_ENABLED is false, the strategy will not be used by Passport
    JwtRs256Strategy,
    TenantContext,
  ],
  controllers: [AuthenticationController],
})
export class AuthenticationModule { }
