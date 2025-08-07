import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

export class AuthCookieUtil {
    constructor(private readonly configService: ConfigService) { }

    getCookieOptions(): Record<string, any> {
        return {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            signed: true,
            path: '/',
            domain: this.configService.get('COOKIE_DOMAIN') || undefined,
        };
    }

    getClearCookieOptions(): Record<string, any> {

        return {
            path: '/',
            domain: this.configService.get('COOKIE_DOMAIN') || undefined,
            secure: this.configService.get('NODE_ENV') === 'production',
            httpOnly: true,
        };
    }

    setAuthCookie(response: Response, name: string, value: string) {
        response.cookie(name, value, this.getCookieOptions());
    }

    clearAllAuthCookies(response: Response) {
        ['refreshToken', 'state', 'roomName'].forEach((cookieName) => {
            response.clearCookie(cookieName, this.getClearCookieOptions());
        });
    }

    clearAuthCookie(response: Response, name: string) {
        response.clearCookie(name, this.getClearCookieOptions());
    }
}
