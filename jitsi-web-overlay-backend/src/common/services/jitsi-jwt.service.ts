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
    generateJitsiJwt(user: any, moderator: boolean, roomName: string): { token: string; exp: number } {
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

        const first = user?.given_name || user?.firstName || user?.prenom || '';
        const last = user?.family_name || user?.lastName || user?.nom || '';
        const full = [first, last].filter(Boolean).join(' ').trim();
        const displayName = full || user?.name || user?.email || 'Invité';
        const email = user?.email || '';

        const now = Math.floor(Date.now() / 1000);
        const exp = now + minutes * 60;
        const nbf = now - 10; // tolérance 10s

        const payload: any = {
            context: {
                user: {
                    avatar: user?.avatar ?? '',
                    name: displayName,
                    email,
                    moderator: Boolean(moderator),
                },
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
