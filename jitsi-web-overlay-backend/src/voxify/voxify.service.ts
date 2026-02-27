import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VoxifyService {

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) { }

    private readonly logger = new Logger(VoxifyService.name);

    private readonly voxApiUrl: string = this.configService.get('VOXAPI_URL');
    private readonly jitsiDomain: string = this.configService.get('JITSI_DOMAIN');

    async getConferenceCode(roomName: string): Promise<string> {
        const conference = `${roomName}@conference.${this.jitsiDomain}`;
        const url = `https://${this.jitsiDomain}/${roomName}`;

        try {
            const response = await this.httpService.axiosRef.get(
                `${this.voxApiUrl}/api/v1/conn/jitsi/conference/code`,
                {
                    params: { conference, url },
                },
            );

            return response.data.id;

        } catch (error) {
            this.logger.error('Error while fetching conference code from Voxify API', {
                message: error?.message,
                stack: error?.stack,
            });
        }
    }

    async getPhoneNumbers(roomName: string): Promise<string> {
        const conference = `${roomName}@conference.${this.jitsiDomain}`;

        try {
            const response = await this.httpService.axiosRef.get(
                `${this.voxApiUrl}/api/v1/conn/jitsi/phoneNumbers`,
                {
                    params: { conference },
                },
            );

            return response.data.numbers.FR[0];

        } catch (error) {
            this.logger.error('Error while fetching phone numbers from Voxify API', {
                message: error?.message,
                stack: error?.stack,
            });
        }
    }
}
