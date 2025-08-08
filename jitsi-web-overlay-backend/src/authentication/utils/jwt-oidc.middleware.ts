import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request as ExpressRequest, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtOidcMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    use(req: ExpressRequest & { user?: any }, res: Response, next: NextFunction) {
        let token: string | undefined;
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }
        if (!token) {
            return next(); // Pas de JWT, on laisse passer (route publique)
        }
        try {
            const publicKey = this.configService.get('OIDC_PUBLIC_KEY');
            const payload = this.jwtService.verify(token, { publicKey });
            req.user = payload;
        } catch (err) {
            throw new UnauthorizedException('JWT OIDC invalide ou expiré');
        }
        next();
    }
}
