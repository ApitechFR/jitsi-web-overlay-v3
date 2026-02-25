import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../context/tenant.context';
import { ConfigService } from '@nestjs/config';

/**
 * TenantMiddleware - manage tenant isolation for multi-tenant mode
 *
 * Responsabilities:
 * 1. Check if RESELLER_MODE_ENABLED is true (multi-tenant mode)
 * 2. Extract clientId from headers if in multi-tenant mode, with priority:
 *    - Header: X-Client-Id
 *    - Header: X-Reseller-Client
 * 3. Store clientId in TenantContext for downstream services and repositories
 * 4. Clear TenantContext after request is finished to prevent memory leaks
 *
 * Usage: Apply globally in AppModule.configure()
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
    private readonly logger = new Logger(TenantMiddleware.name);

    constructor(
        private readonly tenantContext: TenantContext,
        private readonly configService: ConfigService,
    ) { }

    use(req: Request, res: Response, next: NextFunction) {
        // check if multi-tenant mode is enabled
        const resellerModeEnabled = this.configService.get('RESELLER_MODE_ENABLED') === 'true';

        if (!resellerModeEnabled) {
            // single-tenant mode: no clientId, just proceed
            this.tenantContext.setClientId(null);
            return next();
        }

        // multi-tenant mode: extract clientId from headers with priority
        // Priority:
        // 1. Header X-Client-Id
        // 2. Header X-Reseller-Client
        // 3. null (no clientId, should be rejected by guards/services if required)

        const clientIdFromHeader =
            (req.headers['x-client-id'] as string) ||
            (req.headers['x-reseller-client'] as string);

        if (clientIdFromHeader) {
            this.tenantContext.setClientId(clientIdFromHeader);
            this.logger.debug(`TenantMiddleware: clientId injected from header: ${clientIdFromHeader}`);
        }

        // Clear tenant context after response is finished to prevent memory leaks
        res.on('finish', () => {
            this.tenantContext.clear();
        });

        next();
    }
}
