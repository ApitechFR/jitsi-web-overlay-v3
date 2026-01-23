import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'ldapts';
import { DirectoryProvider } from '../directory-provider.interface';

@Injectable()
export class LdapService implements OnModuleDestroy, DirectoryProvider {
    private readonly logger = new Logger(LdapService.name);

    private readonly client: Client | undefined;


    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        const ldapUrl = this.configService.get<string>('LDAP_URL');
        if (ldapUrl) {
            this.client = new Client({
                url: ldapUrl,
                timeout: 100000,
                connectTimeout: 100000,
            });
        } else {
            this.client = undefined;
            this.logger.warn('LDAP_URL non défini : le service LDAP est inactif.');
        }
    }


    async onModuleDestroy() {
        if (this.client) {
            await this.client.unbind();
        }
    }


    async getDirectory(): Promise<any[]> {
        if (!this.client) {
            this.logger.warn('Service LDAP inactif : aucune opération effectuée.');
            return [];
        }
        const bindDN = this.configService.get<string>('LDAP_BIND_DN');
        const bindPassword = this.configService.get<string>('LDAP_PASSWORD');
        const baseDN = this.configService.get<string>('LDAP_BASE_DN');

        try {
            await this.client.bind(bindDN, bindPassword);

            const { searchEntries } = await this.client.search(baseDN, {
                scope: 'sub',
                filter: '(objectClass=inetOrgPerson)',
                attributes: ['uidNumber', 'sn', 'cn', 'Email', 'displayName'],
            });

            return searchEntries;
        } catch (err) {
            this.logger.error('LDAP error', err?.stack || JSON.stringify(err));
            throw err;
        }
    }
}
