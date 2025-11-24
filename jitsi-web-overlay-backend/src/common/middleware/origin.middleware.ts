import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class OriginMiddleware implements NestMiddleware {
    private readonly allowedOrigins: string[];

    constructor() {
        const rawOrigins = process.env.CORS_ORIGIN || '';
        this.allowedOrigins = rawOrigins
            .split(',')
            .map(o => o.trim())
        // If not configured, either allow all or block all
    }

    use(req: Request, res: Response, next: NextFunction) {
        // if no origins are configured, allow all
        if (!this.allowedOrigins.length) {
            // console.warn('Aucune origine configurée dans CORS_ORIGIN');
            return next();
        }

        let origin = req.headers.origin as string | undefined;

        // Fallback to 'referer' if 'origin' is not present.
        if (!origin && req.headers.referer) {
            try {
                const url = new URL(req.headers.referer as string);
                origin = url.origin;
            } catch {
                // referer invalide -> origin reste undefined
            }
        }

        if (!origin || !this.allowedOrigins.some(allowed => origin.startsWith(allowed))) {
            throw new ForbiddenException('Accès direct interdit');
        }

        next();
    }
}
