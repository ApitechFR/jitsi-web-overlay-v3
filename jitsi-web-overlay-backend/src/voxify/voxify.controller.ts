import { Controller, Get, Query } from '@nestjs/common';
import { VoxifyService } from './voxify.service';

@Controller('voxify')
export class VoxifyController {
    constructor(private readonly voxifyService: VoxifyService) { }

    @Get('code')
    async getConferenceCode(@Query('roomName') roomName: string) {
        const id = await this.voxifyService.getConferenceCode(roomName);

        return { id };
    }

    @Get('number')
    async getPhoneNumbers(@Query('roomName') roomName: string) {
        const number = await this.voxifyService.getPhoneNumbers(roomName);

        return { number };
    }
}
