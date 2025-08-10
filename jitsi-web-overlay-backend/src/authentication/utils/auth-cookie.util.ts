import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Injectable()
export class AuthCookieUtil {
    constructor(private readonly configService: ConfigService) { }

    private isProd() {
        return this.configService.get<string>('NODE_ENV') === 'production';
    }

    getCookieOptions(): Record<string, any> {
        return {
            httpOnly: true,
            secure: this.isProd(),
            signed: true,
            path: '/',
            domain: this.configService.get<string>('COOKIE_DOMAIN') || undefined,
            sameSite: this.configService.get<string>('COOKIE_SAMESITE') || 'lax',
        };
    }

    getClearCookieOptions(): Record<string, any> {
        return {
            path: '/',
            domain: this.configService.get<string>('COOKIE_DOMAIN') || undefined,
            secure: this.isProd(),
            httpOnly: true,
            sameSite: this.configService.get<string>('COOKIE_SAMESITE') || 'lax',
        };
    }

    setAuthCookie(response: Response, name: string, value: string) {
        response.cookie(name, value, this.getCookieOptions());
    }

    clearAllAuthCookies(response: Response) {
        ['accessToken', 'refreshToken', 'state', 'roomName'].forEach((cookieName) => {
            response.clearCookie(cookieName, this.getClearCookieOptions());
        });
    }

    clearAuthCookie(response: Response, name: string) {
        response.clearCookie(name, this.getClearCookieOptions());
    }
}
