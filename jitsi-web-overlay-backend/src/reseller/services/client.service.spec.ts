import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { Client } from '../entities/client.entity';
import { Offer } from '../entities/offer.entity';
import { ClientModule } from '../entities/client-module.entity';
import { ClientDomain } from '../entities/client-domain.entity';
import { ClientCustomization } from '../entities/client-customization.entity';
import { ClientAuthConfig } from '../entities/client-auth-config.entity';
import { ClientOfferChangeHistory } from '../entities/client-offer-change-history.entity';
import { EncryptionService } from './encryption.service';
import { OfferType } from '../enums/offer-type.enum';
import { ModuleKey, OFFER_MODULES } from '../enums/module-key.enum';
import { CreateClientDto, UpdateClientDto } from '../dto/client.dto';

describe('ClientService', () => {
  let service: ClientService;
  let clientRepository: Repository<Client>;
  let offerRepository: Repository<Offer>;
  let clientModuleRepository: Repository<ClientModule>;
  let clientDomainRepository: Repository<ClientDomain>;
  let customizationRepository: Repository<ClientCustomization>;
  let authConfigRepository: Repository<ClientAuthConfig>;
  let offerChangeHistoryRepository: Repository<ClientOfferChangeHistory>;
  let encryptionService: EncryptionService;

  const mockResellerId = 'reseller-123';
  const mockClientUid = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: getRepositoryToken(Client),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Offer),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClientModule),
          useValue: {
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClientDomain),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClientCustomization),
          useValue: {
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClientAuthConfig),
          useValue: {
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ClientOfferChangeHistory),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn((data) => JSON.stringify(data)),
            decrypt: jest.fn((data) => JSON.parse(data as string)),
          },
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    clientRepository = module.get<Repository<Client>>(getRepositoryToken(Client));
    offerRepository = module.get<Repository<Offer>>(getRepositoryToken(Offer));
    clientModuleRepository = module.get<Repository<ClientModule>>(
      getRepositoryToken(ClientModule),
    );
    clientDomainRepository = module.get<Repository<ClientDomain>>(
      getRepositoryToken(ClientDomain),
    );
    customizationRepository = module.get<Repository<ClientCustomization>>(
      getRepositoryToken(ClientCustomization),
    );
    authConfigRepository = module.get<Repository<ClientAuthConfig>>(
      getRepositoryToken(ClientAuthConfig),
    );
    offerChangeHistoryRepository = module.get<Repository<ClientOfferChangeHistory>>(
      getRepositoryToken(ClientOfferChangeHistory),
    );
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createClient', () => {
    it('should create a client with basic info', async () => {
      const createDto: CreateClientDto = {
        name: 'Test Client',
        offerType: OfferType.BASIC,
      };

      const mockOffer = { type: OfferType.BASIC, customizationEnabled: false };
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.BASIC,
        resellerId: mockResellerId,
        isActive: true,
        domains: [],
      };

      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer as any);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient as any);
      jest
        .spyOn(clientDomainRepository, 'findOne')
        .mockResolvedValue(null as any);
      jest.spyOn(clientModuleRepository, 'save').mockResolvedValue([
        { moduleKey: ModuleKey.VISIO_JITSI },
      ] as any);
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);

      const result = await service.createClient(createDto, mockResellerId);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Client');
      expect(result.offerType).toBe(OfferType.BASIC);
    });

    it('should inherit modules from offer', async () => {
      const createDto: CreateClientDto = {
        name: 'Test Client',
        offerType: OfferType.PREMIUM,
      };

      const mockOffer = { type: OfferType.PREMIUM, customizationEnabled: true };
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.PREMIUM,
        resellerId: mockResellerId,
        isActive: true,
      };

      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer as any);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient as any);
      jest.spyOn(clientModuleRepository, 'save').mockResolvedValue([
        {
          moduleKey: ModuleKey.VISIO_JITSI,
          enabled: true,
        },
      ] as any);
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);

      await service.createClient(createDto, mockResellerId);

      expect(clientModuleRepository.save).toHaveBeenCalled();
      const savedModules = (clientModuleRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedModules.length).toBeGreaterThan(0);
      expect(savedModules[0].moduleKey).toBeDefined();
      expect(savedModules[0].enabled).toBe(true);
    });

    it('should throw if offer not found', async () => {
      const createDto: CreateClientDto = {
        name: 'Test Client',
        offerType: OfferType.BASIC,
      };

      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createClient(createDto, mockResellerId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce domain uniqueness', async () => {
      const createDto: CreateClientDto = {
        name: 'Test Client',
        offerType: OfferType.BASIC,
        domains: [{ domain: 'example.com' }],
      };

      const mockOffer = { type: OfferType.BASIC, customizationEnabled: false };
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer as any);
      jest
        .spyOn(clientDomainRepository, 'findOne')
        .mockResolvedValue({ domainName: 'example.com' } as any);

      await expect(
        service.createClient(createDto, mockResellerId),
      ).rejects.toThrow(ConflictException);
    });

    it('should save domains if provided', async () => {
      const createDto: CreateClientDto = {
        name: 'Test Client',
        offerType: OfferType.BASIC,
        domains: [{ domain: 'example.com' }, { domain: 'test.com' }],
      };

      const mockOffer = { type: OfferType.BASIC, customizationEnabled: false };
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.BASIC,
        resellerId: mockResellerId,
        isActive: true,
      };

      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer as any);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient as any);
      jest
        .spyOn(clientDomainRepository, 'findOne')
        .mockResolvedValue(null as any);
      jest.spyOn(clientDomainRepository, 'save').mockResolvedValue([
        { domainName: 'example.com' },
        { domainName: 'test.com' },
      ] as any);
      jest.spyOn(clientModuleRepository, 'save').mockResolvedValue([
        { moduleKey: ModuleKey.VISIO_JITSI },
      ] as any);
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);

      await service.createClient(createDto, mockResellerId);

      expect(clientDomainRepository.save).toHaveBeenCalled();
      const savedDomains = (clientDomainRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedDomains.length).toBe(2);
      expect(savedDomains[0].domainName).toBe('example.com');
    });

    it('should save customization if provided and offer supports it', async () => {
      const createDto: CreateClientDto = {
        name: 'Test Client',
        offerType: OfferType.PREMIUM,
        customization: {
          appName: 'My App',
          favicon: 'https://example.com/favicon.ico',
        },
      };

      const mockOffer = { type: OfferType.PREMIUM, customizationEnabled: true };
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.PREMIUM,
        resellerId: mockResellerId,
        isActive: true,
      };

      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer as any);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient as any);
      jest.spyOn(clientModuleRepository, 'save').mockResolvedValue([
        { moduleKey: ModuleKey.VISIO_JITSI },
      ] as any);
      jest.spyOn(customizationRepository, 'save').mockResolvedValue({
        appName: 'My App',
      } as any);
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);

      await service.createClient(createDto, mockResellerId);

      expect(customizationRepository.save).toHaveBeenCalled();
    });

    it('should encrypt auth config when saving', async () => {
      const createDto: CreateClientDto = {
        name: 'Test Client',
        offerType: OfferType.PREMIUM,
        authConfig: {
          type: 'oidc',
          oidcUrl: 'https://oidc.example.com',
          oidcClientId: 'client-123',
        },
      };

      const mockOffer = { type: OfferType.PREMIUM, customizationEnabled: false };
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.PREMIUM,
        resellerId: mockResellerId,
        isActive: true,
      };

      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer as any);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient as any);
      jest.spyOn(clientModuleRepository, 'save').mockResolvedValue([
        { moduleKey: ModuleKey.VISIO_JITSI },
      ] as any);
      jest.spyOn(authConfigRepository, 'save').mockResolvedValue({
        type: 'oidc',
        config: '{"oidcUrl":"..."}',
      } as any);
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);

      await service.createClient(createDto, mockResellerId);

      expect(encryptionService.encrypt).toHaveBeenCalled();
      expect(authConfigRepository.save).toHaveBeenCalled();
    });
  });

  describe('findClient', () => {
    it('should find client by uid and resellerId', async () => {
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.BASIC,
        resellerId: mockResellerId,
        isActive: true,
        modules: [],
        domains: [],
      };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);

      const result = await service.findClient(mockClientUid, mockResellerId);

      expect(result).toBeDefined();
      expect(result.uid).toBe(mockClientUid);
      expect(clientRepository.findOne).toHaveBeenCalledWith({
        where: { uid: mockClientUid, resellerId: mockResellerId, isActive: true },
        relations: expect.any(Array),
      });
    });

    it('should throw if client not found', async () => {
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.findClient(mockClientUid, mockResellerId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return auth config as-is from database', async () => {
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.BASIC,
        resellerId: mockResellerId,
        isActive: true,
        authConfig: { config: { oidcUrl: 'https://example.com' } },
      };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);

      const result = await service.findClient(mockClientUid, mockResellerId);

      expect(result.authConfig.config).toEqual({ oidcUrl: 'https://example.com' });
    });
  });

  describe('findClientsByReseller', () => {
    it('should find clients paginated', async () => {
      const mockClients = [
        {
          uid: mockClientUid,
          name: 'Client 1',
          offerType: OfferType.BASIC,
          resellerId: mockResellerId,
          isActive: true,
        },
      ];

      jest
        .spyOn(clientRepository, 'findAndCount')
        .mockResolvedValue([mockClients, 1] as any);

      const result = await service.findClientsByReseller(mockResellerId, {
        page: 1,
        limit: 20,
      });

      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
      expect(clientRepository.findAndCount).toHaveBeenCalledWith({
        where: { resellerId: mockResellerId, isActive: true },
        relations: expect.any(Array),
        skip: 0,
        take: 20,
        order: expect.any(Object),
      });
    });

    it('should handle pagination correctly', async () => {
      jest
        .spyOn(clientRepository, 'findAndCount')
        .mockResolvedValue([[], 100] as any);

      await service.findClientsByReseller(mockResellerId, { page: 3, limit: 25 });

      expect(clientRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50, // (3-1) * 25
          take: 25,
        }),
      );
    });
  });

  describe('updateClient', () => {
    it('should update client name', async () => {
      const updateDto: UpdateClientDto = { name: 'Updated Name' };
      const mockClient = {
        uid: mockClientUid,
        name: 'Old Name',
        offerType: OfferType.BASIC,
        resellerId: mockResellerId,
        isActive: true,
        domains: [],
      };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient as any);

      await service.updateClient(mockClientUid, updateDto, mockResellerId);

      expect(clientRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Name' }),
      );
    });

    it('should update domains', async () => {
      const updateDto: UpdateClientDto = {
        domains: [{ domain: 'new.com' }, { domain: 'another.com' }],
      };
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.BASIC,
        resellerId: mockResellerId,
        isActive: true,
        domains: [],
      };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);
      jest
        .spyOn(clientDomainRepository, 'findOne')
        .mockResolvedValue(null as any);
      jest.spyOn(clientDomainRepository, 'delete').mockResolvedValue({} as any);
      jest.spyOn(clientDomainRepository, 'save').mockResolvedValue([
        { domainName: 'new.com' },
        { domainName: 'another.com' },
      ] as any);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient as any);

      await service.updateClient(mockClientUid, updateDto, mockResellerId);

      expect(clientDomainRepository.delete).toHaveBeenCalled();
      expect(clientDomainRepository.save).toHaveBeenCalled();
    });

    it('should not allow duplicate domains when updating', async () => {
      const updateDto: UpdateClientDto = {
        domains: [{ domain: 'existing.com' }],
      };
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.BASIC,
        resellerId: mockResellerId,
        isActive: true,
        domains: [],
      };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);
      jest
        .spyOn(clientDomainRepository, 'findOne')
        .mockResolvedValue({ domainName: 'existing.com' } as any);

      await expect(
        service.updateClient(mockClientUid, updateDto, mockResellerId),
      ).rejects.toThrow(ConflictException);
    });

    it('should update customization', async () => {
      const updateDto: UpdateClientDto = {
        customization: { appName: 'New App Name' },
      };
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.PREMIUM,
        resellerId: mockResellerId,
        isActive: true,
        customization: null,
      };
      const mockOffer = { type: OfferType.PREMIUM, customizationEnabled: true };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer as any);
      jest.spyOn(customizationRepository, 'save').mockResolvedValue({
        appName: 'New App Name',
      } as any);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient as any);

      await service.updateClient(mockClientUid, updateDto, mockResellerId);

      expect(customizationRepository.save).toHaveBeenCalled();
    });
  });

  describe('upgradeClient', () => {
    it('should create upgrade request', async () => {
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.BASIC,
        resellerId: mockResellerId,
        isActive: true,
      };
      const mockOffer = { type: OfferType.PREMIUM };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer as any);
      jest.spyOn(offerChangeHistoryRepository, 'save').mockResolvedValue({
        effectiveDate: new Date(),
      } as any);

      const result = await service.upgradeClient(
        mockClientUid,
        { toOffer: OfferType.PREMIUM },
        mockResellerId,
      );

      expect(result.preview).toBeDefined();
      expect(result.preview.currentOffer).toBe(OfferType.BASIC);
      expect(result.preview.newOffer).toBe(OfferType.PREMIUM);
      expect(offerChangeHistoryRepository.save).toHaveBeenCalled();
    });

    it('should throw if upgrading to same offer', async () => {
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.BASIC,
        resellerId: mockResellerId,
        isActive: true,
      };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);

      await expect(
        service.upgradeClient(
          mockClientUid,
          { toOffer: OfferType.BASIC },
          mockResellerId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if trying to upgrade from PREMIUM', async () => {
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.PREMIUM,
        resellerId: mockResellerId,
        isActive: true,
      };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);

      await expect(
        service.upgradeClient(
          mockClientUid,
          { toOffer: OfferType.BASIC },
          mockResellerId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('downgradeClient', () => {
    it('should create downgrade request', async () => {
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.PREMIUM,
        resellerId: mockResellerId,
        isActive: true,
      };
      const mockOffer = { type: OfferType.BASIC };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer as any);
      jest.spyOn(offerChangeHistoryRepository, 'save').mockResolvedValue({
        effectiveDate: new Date(),
      } as any);

      const result = await service.downgradeClient(
        mockClientUid,
        { toOffer: OfferType.BASIC },
        mockResellerId,
      );

      expect(result.preview).toBeDefined();
      expect(result.preview.currentOffer).toBe(OfferType.PREMIUM);
      expect(result.preview.newOffer).toBe(OfferType.BASIC);
    });

    it('should throw if downgrading from BASIC', async () => {
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.BASIC,
        resellerId: mockResellerId,
        isActive: true,
      };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);

      await expect(
        service.downgradeClient(
          mockClientUid,
          { toOffer: OfferType.PREMIUM },
          mockResellerId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteClient', () => {
    it('should soft delete client', async () => {
      const mockClient = {
        uid: mockClientUid,
        name: 'Test Client',
        offerType: OfferType.BASIC,
        resellerId: mockResellerId,
        isActive: true,
        deactivatedAt: null,
      };

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient as any);

      await service.deleteClient(mockClientUid, mockResellerId);

      expect(clientRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        }),
      );
    });
  });
});
