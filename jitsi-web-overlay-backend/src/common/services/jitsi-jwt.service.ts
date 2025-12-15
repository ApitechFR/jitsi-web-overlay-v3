import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';

@Injectable()
export class JitsiJwtService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Génère un JWT pour Jitsi/Prosody
     * @param user informations utilisateur (peut être vide pour Prosody)
     * @param moderator booléen modérateur
     * @param roomName nom de la room ou 'prosody' pour usage service
     */
    generateJitsiJwt(user: any, moderator: boolean, roomName: string, isWebinar?: boolean): { token: string; exp: number } {
        const aud = this.configService.get('JITSI_JITSIJWT_AUD') ?? 'jitsi';
        const iss = this.configService.get('JITSI_JITSIJWT_ISS');
        const sub = this.configService.get('JITSI_JITSIJWT_SUB');
        const minutes = Number(this.configService.get('JITSI_JITSIJWT_EXPIRESAFTER') ?? 60);

        if (!iss || !sub) {
            throw new Error('Jitsi JWT config missing (iss/sub)');
        }
        if (!minutes || minutes <= 0) {
            throw new Error('Invalid Jitsi JWT expiration');
        }

        let displayName, email, avatar, role, affiliation;
        if (isWebinar) {
            // Si l'utilisateur est connecté (présence d'un email ou nom), on prend ses infos mais on force le rôle visitor
            const hasUserInfo = user && (user.email || user.name || user.given_name || user.firstName || user.prenom);
            if (hasUserInfo) {
                const first = user?.given_name || user?.firstName || user?.prenom || '';
                const last = user?.family_name || user?.lastName || user?.nom || '';
                const full = [first, last].filter(Boolean).join(' ').trim();
                displayName = full || user?.name || user?.email || 'Visitor';
                email = user?.email || '';
                avatar = user?.avatar ?? '';
            } else {
                displayName = 'Visitor';
                email = undefined;
                avatar = '';
            }
            role = 'visitor';
            affiliation = 'member';
        } else {
            const first = user?.given_name || user?.firstName || user?.prenom || '';
            const last = user?.family_name || user?.lastName || user?.nom || '';
            const full = [first, last].filter(Boolean).join(' ').trim();
            displayName = full || user?.name || user?.email || 'Invité';
            email = user?.email || '';
            avatar = user?.avatar ?? '';
            role = undefined;
            affiliation = undefined;
        }

        const now = Math.floor(Date.now() / 1000);
        const exp = now + minutes * 60;
        const nbf = now - 10; // tolérance 10s

        const userPayload: any = {
            avatar,
            name: displayName,
            moderator: !isWebinar && Boolean(moderator),
            ...(isWebinar ? { role, affiliation } : {}),
        };
        if (email) userPayload.email = email;

        const payload: any = {
            context: {
                user: userPayload,
            },
            aud, iss, sub,
            room: roomName,
            iat: now,
            nbf,
            exp,
        };

        const secret = this.configService.get('JITSI_JITSIJWT_SECRET');
        let token: string;

        if (secret) {
            token = this.jwtService.sign(payload, {
                secret,
                algorithm: 'HS256',
            });
        } else {
            token = this.configService.get('JITSI_JWT');
            if (!token) {
                throw new Error('No signing secret or fallback token configured');
            }
        }

        return { token, exp };
    }
}
