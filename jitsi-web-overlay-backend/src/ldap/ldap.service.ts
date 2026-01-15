import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'ldapts';
import * as queryString from 'querystring';

@Injectable()
export class LdapService implements OnModuleDestroy {
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

    async getAllLdapUsers(): Promise<any[]> {
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

    async getAllOidcUsers(): Promise<any[]> {

        const usersEndpoint = this.configService.get<string>('OIDC_USERS_ENDPOINT');
        const tokenEndpoint = this.configService.get<string>('TOKEN_ENDPOINT');
        const clientId = this.configService.get<string>('OIDC_CLIENTID');
        const clientSecret = this.configService.get<string>('OIDC_SECRET');

        if (!usersEndpoint || !tokenEndpoint || !clientId) {
            throw new Error('OIDC variables not found');
        }

        try {
            const tokenResp = await this.httpService.axiosRef.post(
                tokenEndpoint,
                queryString.stringify({
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret,
                }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
            );

            const token = tokenResp.data?.access_token;
            if (!token) throw new Error('Unable to get admin access-token');

            const resp = await this.httpService.axiosRef.get(usersEndpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            return Array.isArray(resp.data) ? resp.data : [resp.data];

        } catch (error) {
            this.logger.error('Erreur get all oidc users', {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
            });
            throw new Error(`Erreur lors de la récupération des utilisateurs OIDC : ${error?.message}`);
        }
    }
}
