import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as queryString from 'querystring';
import { DirectoryProvider } from '../directory-provider.interface';
import { OidcUser } from './types/oidc-user.interface';

@Injectable()
export class OidcService implements DirectoryProvider {
    private readonly logger = new Logger(OidcService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) { }

    async getDirectory(): Promise<OidcUser[]> {

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
