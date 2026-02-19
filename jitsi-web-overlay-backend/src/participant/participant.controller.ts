import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ParticipantService } from './participant.service';
import { CreateParticipantDto, UpdateParticipantDto } from './dto/create-participant.dto';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';

@Controller('participants')
export class ParticipantController {
    constructor(private readonly participantService: ParticipantService) { }

    // @Post()
    // create(@Body() dto: CreateParticipantDto, @Req() req: Request) {
    //     const clientIp =
    //         (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    //         req.socket.remoteAddress ||
    //         req.ip;
    //     console.log(req.ip, req.socket.remoteAddress, req.headers['x-forwarded-for']);    
    //     console.log('--- Creating participant ---');
    //     console.log({ dto, clientIp });
    //     return this.participantService.create(dto, clientIp);
    // }

    @Get('conferences')
    async getConferenceUIDsByEmail(@Query('email') email: string) {
        if (!email) {
            throw new BadRequestException('email is required');
        }

        const confUIDs = await this.participantService.getConferenceUIDsByEmail(email);

        return {
            email,
            total: confUIDs.length,
            conferences: confUIDs,
        };
    }

    @Post()
    create(@Body() dto: CreateParticipantDto) {
        return this.participantService.create(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll() {
        return this.participantService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':uid')
    findOne(@Param('uid') uid: string) {
        return this.participantService.findOne(uid);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':uid')
    update(
        @Param('uid') uid: string,
        @Body() dto: UpdateParticipantDto,
    ) {
        return this.participantService.update(uid, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('conference/:conferenceUid')
    getParticipantsByConference(
        @Param('conferenceUid') conferenceUid: string,
        @Query() paginationDto: PaginationDto,
    ) {
        return this.participantService.getParticipantByConfUID(conferenceUid, paginationDto);
    }
}
