import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyService } from './services/api-key.service';
import { EncryptionService } from './services/encryption.service';
import { OfferSeedService } from './services/offer-seed.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ClientService } from './services/client.service';
import { OfferService } from './services/offer.service';
import { OfferChangeService } from './services/offer-change.service';
import { ClientController, OfferController } from './controllers/client.controller';
import { PublicOfferController } from './controllers/public-offer.controller';
import { OfferChangeController } from './controllers/offer-change.controller';
import { ApiKeyController } from './controllers/api-key.controller';
import { ApiKeyRepository } from './repositories/api-key.repository';
import {
  Offer,
  Client,
  ClientCustomization,
  ClientModule,
  ClientAuthConfig,
  ClientDomain,
  ApiKey,
  ClientOfferChangeHistory,
} from './entities';

/**
 * Reseller Module
 * Manage clients, offers, API keys for resellers
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Offer,
      Client,
      ClientCustomization,
      ClientModule,
      ClientAuthConfig,
      ClientDomain,
      ApiKey,
      ClientOfferChangeHistory,
    ]),
  ],
  controllers: [ClientController, OfferController, PublicOfferController, OfferChangeController, ApiKeyController],
  providers: [
    ApiKeyService,
    EncryptionService,
    OfferSeedService,
    ApiKeyGuard,
    ClientService,
    OfferService,
    OfferChangeService,
    ApiKeyRepository,
  ],
  exports: [
    ApiKeyService,
    EncryptionService,
    ApiKeyGuard,
    ClientService,
    OfferService,
    OfferChangeService,
    ApiKeyRepository,
  ],
})
export class ResellerModule { }
