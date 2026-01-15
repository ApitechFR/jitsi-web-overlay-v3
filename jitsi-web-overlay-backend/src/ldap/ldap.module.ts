import { Module } from '@nestjs/common';
import { LdapService } from './ldap.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [LdapService],
  exports: [LdapService],
})
export class LdapModule {}