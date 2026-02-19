import {
    Controller,
    Post,
    Headers,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyService } from '../services/api-key.service';
import { ApiKeyResponseDto } from '../dto/api-key.dto';

@Controller('reseller/api-keys')
export class ApiKeyController {
    constructor(
        private readonly apiKeyService: ApiKeyService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Bootstrap: Générer la clé API unique avec secret
     * POST /api/reseller/api-keys/bootstrap
     * Headers: x-bootstrap-secret: <BOOTSTRAP_SECRET>
     */
    @Post('bootstrap')
    @HttpCode(HttpStatus.CREATED)
    async bootstrapApiKey(
        @Headers('x-bootstrap-secret') bootstrapSecret: string,
    ): Promise<ApiKeyResponseDto> {
        // Vérifier que le mode reseller est activé
        const resellerModeEnabled = this.configService.get<boolean>('RESELLER_MODE_ENABLED', false);
        if (!resellerModeEnabled) {
            throw new ForbiddenException('Reseller mode is not enabled');
        }

        const expectedSecret = this.configService.get<string>('BOOTSTRAP_SECRET');

        if (!expectedSecret) {
            throw new UnauthorizedException(
                'Bootstrap endpoint is not configured (missing BOOTSTRAP_SECRET)',
            );
        }

        if (!bootstrapSecret) {
            throw new UnauthorizedException(
                'Bootstrap secret missing in header (x-bootstrap-secret)',
            );
        }

        // Comparaison temps constant
        if (!this.constantTimeCompare(bootstrapSecret, expectedSecret)) {
            throw new UnauthorizedException('Invalid bootstrap secret');
        }

        return this.apiKeyService.generateAndStoreApiKey();
    }

    /**
     * Comparaison temps constant pour éviter les attaques par timing
     */
    private constantTimeCompare(a: string, b: string): boolean {
        if (a.length !== b.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }

        return result === 0;
    }
}
