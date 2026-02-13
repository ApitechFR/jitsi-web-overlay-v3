import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { ApiKeyService } from '../services/api-key.service';
import { TenantContext } from '../../common/context/tenant.context';

/**
 * Guard pour valider les clés API des revendeurs
 * Utilise le header "x-api-key"
 * 
 * Usage: @UseGuards(ApiKeyGuard)
 * Ou globalement: app.useGlobalGuards(new ApiKeyGuard(...))
 * 
 * Vérifie:
 * - Présence du header x-api-key
 * - Format valide (64 chars hex)
 * - Hash correspond à une clé en BD (TODO: via ApiKeyRepository)
 * - Extrait reseller_id et l'injecte dans request.resellerId
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
    private readonly logger = new Logger(ApiKeyGuard.name);

    constructor(
        private apiKeyService: ApiKeyService,
        private tenantContext: TenantContext,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Extraire le header x-api-key
        const apiKey = this.extractApiKeyFromHeader(request);
        if (!apiKey) {
            this.logger.warn('API Key manquante dans header x-api-key');
            throw new UnauthorizedException('API Key manquante (header: x-api-key)');
        }

        // Valider le format de la clé (64 chars hex)
        if (!this.apiKeyService.isValidApiKeyFormat(apiKey)) {
            this.logger.warn(`Format de clé API invalide: ${apiKey.substring(0, 8)}...`);
            throw new UnauthorizedException('Format de clé API invalide');
        }

        // TODO: Valider contra la BD via ApiKeyRepository
        // const apiKeyRecord = await this.apiKeyRepository.findByKeyHash(...)
        // if (!apiKeyRecord) { throw new UnauthorizedException(...) }

        // Pour maintenant, accepter toute clé au format valide
        // En production, il faudra vérifier contra la BD
        this.logger.debug(
            `API Key validée (format OK): ${apiKey.substring(0, 8)}...`,
        );

        // TODO: Extraire reseller_id depuis apiKeyRecord
        // request.resellerId = apiKeyRecord.resellerId;
        // this.tenantContext.setResellerId(apiKeyRecord.resellerId);

        // Placeholder: utiliser un ID statique pour le dev
        request.resellerId = 'dev-reseller-1';

        return true;
    }

    /**
     * Extrait la clé API du header x-api-key
     */
    private extractApiKeyFromHeader(request: any): string | null {
        const header = request.headers['x-api-key'];
        if (!header) {
            return null;
        }

        // En cas d'array de headers, prendre le premier
        return Array.isArray(header) ? header[0] : header;
    }
}
