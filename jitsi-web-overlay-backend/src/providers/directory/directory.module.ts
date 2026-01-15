import { Module } from '@nestjs/common';
import { OidcService } from './oidc/oidc.service';
import { LdapService } from './ldap/ldap.service';
import { LdapModule } from './ldap/ldap.module';
import { HttpModule } from '@nestjs/axios';
import { OidcModule } from './oidc/oidc.module';

@Module({
    imports: [
        HttpModule,
        LdapModule,
        OidcModule
    ],
    providers: [
        {
            provide: 'IDirectory',
            useFactory: (ldapService: LdapService, oidcService: OidcService) => {
                return process.env.DIRECTORY_PROVIDER === 'LDAP' ?  ldapService : oidcService;
            },
            inject: [LdapService, OidcService],
        }
    ],

    exports: ['IDirectory'],
})
export class DirectoryModule { }