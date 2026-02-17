import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from '../services/client.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { ApiKeyService } from '../services/api-key.service';
import { TenantContext } from '../../common/context/tenant.context';
import { OfferType } from '../enums/offer-type.enum';

describe('ClientController', () => {
  let controller: ClientController;
  let service: ClientService;

  const mockResellerId = 'reseller-123';
  const mockClientUid = '550e8400-e29b-41d4-a716-446655440000';

  const mockClient = {
    uid: mockClientUid,
    name: 'Test Client',
    offerType: OfferType.BASIC,
    resellerId: mockResellerId,
    isActive: true,
    createdAt: new Date(),
    deactivatedAt: null,
    updatedAt: new Date(),
    modules: [],
    domains: [],
    customization: null,
    authConfig: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        {
          provide: ClientService,
          useValue: {
            createClient: jest.fn(),
            findClient: jest.fn(),
            findClientsByReseller: jest.fn(),
            updateClient: jest.fn(),
            deleteClient: jest.fn(),
            upgradeClient: jest.fn(),
            downgradeClient: jest.fn(),
          },
        },
        {
          provide: ApiKeyService,
          useValue: {
            validateApiKey: jest.fn(),
            getResellerId: jest.fn(),
          },
        },
        {
          provide: TenantContext,
          useValue: {
            setResellerId: jest.fn(),
            getResellerId: jest.fn(),
          },
        },
        {
          provide: ApiKeyGuard,
          useValue: {
            canActivate: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<ClientController>(ClientController);
    service = module.get<ClientService>(ClientService);
  });

  describe('POST /reseller/clients', () => {
    it('should create a client', async () => {
      const createDto = { name: 'New Client', offerType: OfferType.BASIC };
      jest.spyOn(service, 'createClient').mockResolvedValue(mockClient as any);

      const result = await controller.createClient(createDto, mockResellerId);

      expect(result).toBeDefined();
      expect(result.uid).toBe(mockClientUid);
      expect(service.createClient).toHaveBeenCalledWith(createDto, mockResellerId);
    });
  });

  describe('GET /reseller/clients', () => {
    it('should list clients with pagination', async () => {
      const mockClients = [mockClient];
      jest.spyOn(service, 'findClientsByReseller').mockResolvedValue({
        data: mockClients,
        total: 1,
      } as any);

      const result = await controller.listClients(
        { page: 1, limit: 20 },
        mockResellerId,
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pages).toBe(1);
    });

    it('should handle default pagination parameters', async () => {
      jest.spyOn(service, 'findClientsByReseller').mockResolvedValue({
        data: [],
        total: 0,
      } as any);

      const result = await controller.listClients({}, mockResellerId);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('GET /reseller/clients/:uid', () => {
    it('should get a single client', async () => {
      jest.spyOn(service, 'findClient').mockResolvedValue(mockClient as any);

      const result = await controller.getClient(mockClientUid, mockResellerId);

      expect(result).toBeDefined();
      expect(result.uid).toBe(mockClientUid);
      expect(service.findClient).toHaveBeenCalledWith(mockClientUid, mockResellerId);
    });
  });

  describe('PUT /reseller/clients/:uid', () => {
    it('should update a client', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedClient = { ...mockClient, name: 'Updated Name' };
      jest.spyOn(service, 'updateClient').mockResolvedValue(updatedClient as any);

      const result = await controller.updateClient(
        mockClientUid,
        updateDto,
        mockResellerId,
      );

      expect(result.name).toBe('Updated Name');
      expect(service.updateClient).toHaveBeenCalledWith(
        mockClientUid,
        updateDto,
        mockResellerId,
      );
    });
  });

  describe('DELETE /reseller/clients/:uid', () => {
    it('should delete a client', async () => {
      jest.spyOn(service, 'deleteClient').mockResolvedValue(undefined);

      await controller.deleteClient(mockClientUid, mockResellerId);

      expect(service.deleteClient).toHaveBeenCalledWith(
        mockClientUid,
        mockResellerId,
      );
    });
  });

  describe('POST /reseller/clients/:uid/upgrade', () => {
    it('should upgrade a client', async () => {
      const upgradeDto = { toOffer: OfferType.PREMIUM };
      const preview = {
        preview: {
          currentOffer: OfferType.BASIC,
          newOffer: OfferType.PREMIUM,
        },
        appliedAt: new Date(),
      };
      jest.spyOn(service, 'upgradeClient').mockResolvedValue(preview as any);

      const result = await controller.upgradeClient(
        mockClientUid,
        upgradeDto,
        mockResellerId,
      );

      expect(result).toBeDefined();
      expect(result.preview).toBeDefined();
      expect(service.upgradeClient).toHaveBeenCalledWith(
        mockClientUid,
        upgradeDto,
        mockResellerId,
      );
    });
  });

  describe('POST /reseller/clients/:uid/downgrade', () => {
    it('should downgrade a client', async () => {
      const downgradeDto = { toOffer: OfferType.BASIC };
      const preview = {
        preview: {
          currentOffer: OfferType.PREMIUM,
          newOffer: OfferType.BASIC,
        },
        appliedAt: new Date(),
      };
      jest.spyOn(service, 'downgradeClient').mockResolvedValue(preview as any);

      const result = await controller.downgradeClient(
        mockClientUid,
        downgradeDto,
        mockResellerId,
      );

      expect(result).toBeDefined();
      expect(result.preview).toBeDefined();
      expect(service.downgradeClient).toHaveBeenCalledWith(
        mockClientUid,
        downgradeDto,
        mockResellerId,
      );
    });
  });
});
