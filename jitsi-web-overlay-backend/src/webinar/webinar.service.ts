import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebinarInvitation } from './webinar.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class WebinarService {
    constructor(
        @InjectRepository(WebinarInvitation)
        private readonly invitationRepo: Repository<WebinarInvitation>,
    ) { }

    async createInvitation(roomName: string, jwt: string, type: string = 'visitor', expiresInMinutes = 60): Promise<WebinarInvitation> {
        // Génère un token court unique (8 caractères hex)
        let token: string;
        do {
            token = randomBytes(4).toString('hex');
        } while (await this.invitationRepo.findOne({ where: { token } }));

        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
        const invitation = this.invitationRepo.create({
            token,
            roomName,
            jwt,
            type,
            expiresAt,
        });
        return this.invitationRepo.save(invitation);
    }

    async getInvitationByToken(token: string): Promise<WebinarInvitation | null> {
        const invitation = await this.invitationRepo.findOne({ where: { token } });
        if (!invitation) return null;
        if (invitation.expiresAt && invitation.expiresAt < new Date()) return null;
        return invitation;
    }
}
