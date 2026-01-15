import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'ldapts';
import { IDirectory } from '../directory.interface';

@Injectable()
export class LdapService implements OnModuleDestroy, IDirectory {
    private readonly logger = new Logger(LdapService.name);
    private readonly client: Client;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        this.client = new Client({
            url: this.configService.get<string>('LDAP_URL'),
            timeout: 100000,
            connectTimeout: 100000,
        });
    }

    async onModuleDestroy() {
        await this.client.unbind();
    }

    async getDirectoryUsers(): Promise<any[]> {
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

            console.log('LDAP search entries:', searchEntries);

            return searchEntries;
        } catch (err) {
            this.logger.error('LDAP error', err);
            throw err;
        }
    }
}
