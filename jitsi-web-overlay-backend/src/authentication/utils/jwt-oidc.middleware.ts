import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class JwtOidcMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    use(req: Request & { user?: any }, _res: Response, next: NextFunction) {
        let token: string | undefined;

        //  Authorization: Bearer <token>
        const auth = req.headers['authorization'];
        if (auth && typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
            token = auth.slice(7);
        }
        //  Cookies signés
        else if ((req as any).signedCookies && (req as any).signedCookies.accessToken) {
            token = (req as any).signedCookies.accessToken;
        }

        if (token) {
            try {
                const secret = this.configService.get<string>('JWT_SECRET');
                const payload = this.jwtService.verify(token, { secret, algorithms: ['HS256'] });
                req.user = payload;
            } catch {
                // token invalide → on n’attache rien, on laisse passer.
                // Les routes protégées utiliseront un guard pour forcer l’auth.
            }
        }

        next();
    }
}
