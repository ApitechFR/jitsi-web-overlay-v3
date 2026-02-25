import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyService } from '../services/api-key.service';
import { ApiKeyRepository } from '../repositories/api-key.repository';

/**
 * Guard pour valider les clés API des revendeurs
 * Utilise le header "x-api-key"
 * 
 * Usage: @UseGuards(ApiKeyGuard)
 * Ou globalement: app.useGlobalGuards(new ApiKeyGuard(...))
 * 
 * Accepte deux types de clés (touts environnements):
 * 1. BOOTSTRAP_SECRET (pour bootstrap et urgences)
 * 2. Clés générées et hashées en BD (pour la production)
 * 
 * Vérifie:
 * - Présence du header x-api-key
 * - Format valide (64 chars hex)
 * - Correspond au BOOTSTRAP_SECRET ou est hachée en BD
 * - Injecte reseller_id dans request.resellerId
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
    private readonly logger = new Logger(ApiKeyGuard.name);
    private readonly RESELLER_ID = 'reseller-1'; // Seul revendeur du systeme

    constructor(
        private readonly apiKeyService: ApiKeyService,
        private readonly apiKeyRepository: ApiKeyRepository,
        private readonly configService: ConfigService,
    ) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Vérifier que le mode reseller est activé
        const resellerModeEnabled = this.configService.get<boolean>('RESELLER_MODE_ENABLED', false);
        if (!resellerModeEnabled) {
            this.logger.warn('ApiKeyGuard: RESELLER_MODE_ENABLED is not enabled - rejecting API Key access');
            throw new ForbiddenException('Reseller mode is not enabled');
        }

        // Extraire le header x-api-key
        const apiKey = this.extractApiKeyFromHeader(request);
        if (!apiKey) {
            this.logger.warn('API Key is missing from x-api-key header');
            throw new UnauthorizedException('API Key is required in x-api-key header');
        }

        // Valider le format de la clé (64 chars hex)
        if (!this.apiKeyService.isValidApiKeyFormat(apiKey)) {
            this.logger.warn(`API Key format is invalid: ${apiKey.substring(0, 8)}...`);
            throw new UnauthorizedException('API Key format is invalid');
        }

        // Accepter BOOTSTRAP_SECRET (tous les environnements)
        const bootstrapSecret = this.configService.get<string>('BOOTSTRAP_SECRET');
        if (bootstrapSecret && apiKey === bootstrapSecret) {
            this.logger.debug(
                `API Key validated via BOOTSTRAP_SECRET: ${apiKey.substring(0, 8)}...`,
            );
            request.resellerId = this.RESELLER_ID;
            return true;
        }

        // Valider contre la BD via ApiKeyRepository
        // Chercher toutes les clés (peu nombreuses) et valider le hash
        const apiKeyRecords = await this.apiKeyRepository.findAll();
        let isValidKey = false;

        for (const record of apiKeyRecords) {
            if (this.apiKeyService.validateApiKey(apiKey, record.keyHash)) {
                isValidKey = true;
                break;
            }
        }

        if (!isValidKey) {
            this.logger.warn(`Invalid API Key: ${apiKey.substring(0, 8)}...`);
            throw new UnauthorizedException('Invalid API Key');
        }

        this.logger.debug(
            `API Key validated via database: ${apiKey.substring(0, 8)}... (reseller: ${this.RESELLER_ID})`,
        );

        // Injecter reseller_id dans la request
        request.resellerId = this.RESELLER_ID;

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
