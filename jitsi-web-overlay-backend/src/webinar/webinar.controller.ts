import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { WebinarService } from './webinar.service';

@Controller('webinar')
export class WebinarController {
    constructor(private readonly webinarService: WebinarService) { }

    // POST /webinar/invite
    @Post('invite')
    async createInvitation(@Body() body: { roomName: string; jwt: string; type?: string }) {
        const { roomName, jwt, type } = body;
        const invitation = await this.webinarService.createInvitation(roomName, jwt, type);
        return { token: invitation.token, expiresAt: invitation.expiresAt };
    }

    // GET /webinar/invite/:token
    @Get('invite/:token')
    async getInvitation(@Param('token') token: string) {
        const invitation = await this.webinarService.getInvitationByToken(token);
        if (!invitation) throw new NotFoundException('Invitation not found or expired');
        return { roomName: invitation.roomName, jwt: invitation.jwt, type: invitation.type };
    }
}
