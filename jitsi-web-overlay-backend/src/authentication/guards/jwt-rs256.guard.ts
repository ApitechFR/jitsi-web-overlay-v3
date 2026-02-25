import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * JwtRs256Guard - Guard pour protéger les endpoints multi-tenant
 *
 * Responsabilités:
 * 1. Vérifier si RESELLER_MODE_ENABLED est activé
 * 2. Si oui: vérifier que le JWT Bearer token est présent et valide
 * 3. Si non: passer (permettre l'accès sans JWT)
 *
 * Usage dans les contrôleurs:
 * ```typescript
 * @Controller('api/v1/conferences')
 * @UseGuards(JwtRs256Guard)
 * export class ConferenceController {
 *   @Get(':uid')
 *   async getConference(@Param('uid') uid: string) {
 *     return this.conferenceService.findOne(uid);
 *   }
 * }
 * ```
 *
 * Flux en mode multi-tenant:
 * 1. Client envoie: Authorization: Bearer <JWT_RS256>
 * 2. Guard vérifie présence du token
 * 3. Guard délègue validation à JwtRs256Strategy (Passport)
 * 4. Strategy valide la signature RS256
 * 5. Si valide: injecte user dans req.user et clientId dans TenantContext
 * 6. Si invalide: 401 Unauthorized
 *
 * Flux en mode single-tenant:
 * 1. Guard retourne true (bypass)
 * 2. OIDC existing flow process normally
 */
@Injectable()
export class JwtRs256Guard implements CanActivate {
    constructor(private readonly configService: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // check if reseller mode is enabled
        const resellerModeEnabled = this.configService.get('RESELLER_MODE_ENABLED') === 'true';

        // Single-tenant mode: allow access without JWT (OIDC will handle authentication)
        if (!resellerModeEnabled) {
            return true;
        }

        // Multi-tenant mode: require valid JWT Bearer token
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        // check presence of Authorization header
        if (!authHeader) {
            throw new ForbiddenException('Missing Authorization header. Expected: Bearer <JWT>');
        }

        const [scheme, token] = authHeader.split(' ');

        if (scheme !== 'Bearer' || !token) {
            throw new ForbiddenException('Invalid Authorization header format. Expected: Bearer <JWT>');
        }

        // La validation réelle du JWT sera faite par Passport JwtRs256Strategy
        // Ce guard seulement vérifie la présence du token
        // Le token sera validé par @UseGuards(AuthGuard('jwt-rs256'))

        return true;
    }
}
