import { Global, Module } from '@nestjs/common';
import { ApiKeyService } from './services/api-key.service';
import { EncryptionService } from './services/encryption.service';
import { ApiKeyGuard } from './guards/api-key.guard';

/**
 * Module Reseller
 * Gère tout ce qui est revendeur: API keys, clients, offres, personnalisation
 */
@Global()
@Module({
    providers: [ApiKeyService, EncryptionService, ApiKeyGuard],
    exports: [ApiKeyService, EncryptionService, ApiKeyGuard],
})
export class ResellerModule { }
