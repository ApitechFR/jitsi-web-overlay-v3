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
     * Generate a JWT for Jitsi Webinar viewer
     * @param user user information (can be empty for Prosody)
     * @param moderator boolean moderator
     * @param roomName name of the room or 'prosody' for service use
     */

    generateWebinarViewerJwt(user: any, roomName: string): { token: string; exp: number } {
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

        let displayName, email, avatar;
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
        const role = 'visitor';
        const affiliation = 'member';

        const now = Math.floor(Date.now() / 1000);
        const exp = now + minutes * 60;
        const nbf = now - 10; // tolérance 10s

        const userPayload: any = {
            avatar,
            name: displayName,
            moderator: false,
            role,
            affiliation,
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

    /**
     * Génère un JWT Jitsi pour un test matériel (durée 5 minutes, droits minimaux)
     */
    generateTestJitsiJwt(user: any, roomName: string): { token: string; exp: number } {
        const aud = this.configService.get('JITSI_JITSIJWT_AUD') ?? 'jitsi';
        const iss = this.configService.get('JITSI_JITSIJWT_ISS');
        const sub = this.configService.get('JITSI_JITSIJWT_SUB');
        const minutes = 5;

        if (!iss || !sub) {
            throw new Error('Jitsi JWT config missing (iss/sub)');
        }

        const displayName = user?.name || 'Test Guest';
        const email = user?.email || '';

        const now = Math.floor(Date.now() / 1000);
        const exp = now + minutes * 60;
        const nbf = now - 10;

        const payload: any = {
            context: {
                user: {
                    avatar: user?.avatar ?? '',
                    name: displayName,
                    email,
                    moderator: true,
                    role: 'moderator',
                    affiliation: 'owner',
                },
            },
            aud,
            iss,
            sub,
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
    /**
     * Generate a JWT for Jitsi/Prosody
     * If isWebinar=true and moderator=true, the role will be "moderator" (and affiliation "owner")
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

        // Adding role/affiliation fields for webinar compatibility
        let role, affiliation;
        if (moderator) {
            role = 'moderator';
            affiliation = 'owner';
        } else {
            role = 'visitor';
            affiliation = 'member';
        }

        const payload: any = {
            context: {
                user: {
                    avatar: user?.avatar ?? '',
                    name: displayName,
                    email,
                    moderator: Boolean(moderator),
                    role,
                    affiliation,
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
