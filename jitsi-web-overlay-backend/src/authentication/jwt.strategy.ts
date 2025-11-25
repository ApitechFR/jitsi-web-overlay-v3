import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: (req) => {
                // Priorité à l'en-tête Authorization
                let token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
                // Sinon on récupère depuis le cookie signé 'accessToken'
                if (!token && req && req.signedCookies && req.signedCookies.accessToken) {
                    token = req.signedCookies.accessToken;
                }
                return token;
            },
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
        });
    }

    async validate(payload: any) {
        return { userId: payload.sub, email: payload.email, uid: payload.uid, ...payload};
    }
}
