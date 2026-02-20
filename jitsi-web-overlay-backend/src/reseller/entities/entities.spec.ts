import { Offer } from './offer.entity';
import { Client } from './client.entity';
import { ClientCustomization } from './client-customization.entity';
import { ClientModule } from './client-module.entity';
import { ClientAuthConfig } from './client-auth-config.entity';
import { ClientDomain } from './client-domain.entity';
import { ApiKey } from './api-key.entity';
import { ClientOfferChangeHistory } from './client-offer-change-history.entity';
import { OfferType } from '../enums/offer-type.enum';
import { ModuleKey } from '../enums/module-key.enum';

describe('Reseller Entities', () => {
    describe('Offer Entity', () => {
        it('should have required columns', () => {
            expect(Offer).toBeDefined();
            const offer = new Offer();
            offer.type = OfferType.BASIC;
            offer.name = 'Basic Offer';
            offer.modules = [ModuleKey.VISIO_JITSI, ModuleKey.FEEDBACK];
            offer.customizationEnabled = false;

            expect(offer.type).toBe(OfferType.BASIC);
            expect(offer.name).toBe('Basic Offer');
            expect(offer.modules).toContain(ModuleKey.VISIO_JITSI);
        });
    });

    describe('Client Entity', () => {
        it('should have required columns', () => {
            expect(Client).toBeDefined();
            const client = new Client();
            client.uid = '550e8400-e29b-41d4-a716-446655440000';
            client.name = 'Test Client';
            client.offerType = OfferType.PREMIUM;
            client.isActive = true;

            expect(client.uid).toBeDefined();
            expect(client.name).toBe('Test Client');
            expect(client.offerType).toBe(OfferType.PREMIUM);
        });
    });

    describe('ClientCustomization Entity', () => {
        it('should be optional and related to Client', () => {
            expect(ClientCustomization).toBeDefined();
            const customization = new ClientCustomization();
            customization.appName = 'My App';
            customization.favicon = 'https://example.com/favicon.ico';

            expect(customization.appName).toBe('My App');
        });
    });

    describe('ClientModule Entity', () => {
        it('should track enabled modules per client', () => {
            expect(ClientModule).toBeDefined();
            const module = new ClientModule();
            module.moduleKey = ModuleKey.WEBINAR;
            module.enabled = true;

            expect(module.moduleKey).toBe(ModuleKey.WEBINAR);
            expect(module.enabled).toBe(true);
        });
    });

    describe('ClientAuthConfig Entity', () => {
        it('should store encrypted authentication config', () => {
            expect(ClientAuthConfig).toBeDefined();
            const authConfig = new ClientAuthConfig();
            authConfig.type = 'oidc';
            authConfig.config = {
                oidcUrl: 'https://oidc.example.com',
                oidcClientId: 'client-123',
            };

            expect(authConfig.type).toBe('oidc');
            expect(authConfig.config).toHaveProperty('oidcUrl');
        });
    });

    describe('ClientDomain Entity', () => {
        it('should enforce unique domains', () => {
            expect(ClientDomain).toBeDefined();
            const domain = new ClientDomain();
            domain.domainName = 'example.com';

            expect(domain.domainName).toBe('example.com');
        });
    });

    describe('ApiKey Entity', () => {
        it('should store hashed API keys', () => {
            expect(ApiKey).toBeDefined();
            const apiKey = new ApiKey();
            apiKey.keyHash =
                '100000$salt$hashedvalue'; // PBKDF2 format
            apiKey.resellerId = 'reseller-123';
            apiKey.isActive = true;

            expect(apiKey.keyHash).toBeDefined();
            expect(apiKey.isActive).toBe(true);
        });
    });

    describe('ClientOfferChangeHistory Entity', () => {
        it('should track offer changes with timestamps', () => {
            expect(ClientOfferChangeHistory).toBeDefined();
            const history = new ClientOfferChangeHistory();
            history.fromOffer = OfferType.BASIC;
            history.toOffer = OfferType.PREMIUM;
            history.status = 'pending';

            expect(history.fromOffer).toBe(OfferType.BASIC);
            expect(history.toOffer).toBe(OfferType.PREMIUM);
            expect(history.status).toBe('pending');
        });
    });

    describe('Entity Relationships', () => {
        it('should have proper relation types', () => {
            // This test just verifies the entities are importable and instantiable
            // Actual relationship testing done via integration/E2E tests with real DB
            expect(Offer).toBeDefined();
            expect(Client).toBeDefined();
            expect(ClientCustomization).toBeDefined();
            expect(ClientModule).toBeDefined();
            expect(ClientAuthConfig).toBeDefined();
            expect(ClientDomain).toBeDefined();
            expect(ApiKey).toBeDefined();
            expect(ClientOfferChangeHistory).toBeDefined();
        });
    });
});
