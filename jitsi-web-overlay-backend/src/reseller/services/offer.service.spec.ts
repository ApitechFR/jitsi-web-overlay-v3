import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferChangeService } from './offer-change.service';
import { Offer } from '../entities/offer.entity';
import { Client } from '../entities/client.entity';
import { ClientModule } from '../entities/client-module.entity';
import { ClientOfferChangeHistory } from '../entities/client-offer-change-history.entity';
import { OfferType } from '../enums/offer-type.enum';
import { ModuleKey, OFFER_MODULES } from '../enums/module-key.enum';

describe('OfferService', () => {
  let service: OfferService;
  let offerRepository: Repository<Offer>;

  const mockBasicOffer = {
    id: 1,
    type: OfferType.BASIC,
    name: 'Basic Offer',
    description: 'Basic offer with essential modules',
    modules: [ModuleKey.VISIO_JITSI],
    customizationEnabled: false,
    createdAt: new Date(),
  };

  const mockPremiumOffer = {
    id: 2,
    type: OfferType.PREMIUM,
    name: 'Premium Offer',
    description: 'Complete offer with all modules',
    modules: Object.values(ModuleKey).filter(
      (m) => OFFER_MODULES[OfferType.PREMIUM]?.includes(m),
    ),
    customizationEnabled: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfferService,
        {
          provide: getRepositoryToken(Offer),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OfferService>(OfferService);
    offerRepository = module.get<Repository<Offer>>(getRepositoryToken(Offer));
  });

  describe('getAllOffers', () => {
    it('should return all offers', async () => {
      jest
        .spyOn(offerRepository, 'find')
        .mockResolvedValue([mockBasicOffer, mockPremiumOffer] as any);

      const result = await service.getAllOffers();

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe(OfferType.BASIC);
      expect(result[1].type).toBe(OfferType.PREMIUM);
      expect(offerRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('getOfferByType', () => {
    it('should return offer by type', async () => {
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockBasicOffer as any);

      const result = await service.getOfferByType(OfferType.BASIC);

      expect(result).toBeDefined();
      expect(result.type).toBe(OfferType.BASIC);
      expect(offerRepository.findOne).toHaveBeenCalledWith({
        where: { type: OfferType.BASIC },
      });
    });

    it('should throw if offer not found', async () => {
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getOfferByType(OfferType.BASIC)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOfferModules', () => {
    it('should return modules for an offer', async () => {
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockBasicOffer as any);

      const result = await service.getOfferModules(OfferType.BASIC);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain(ModuleKey.VISIO_JITSI);
    });

    it('should throw if offer not found', async () => {
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getOfferModules(OfferType.PREMIUM)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOfferInfo', () => {
    it('should return complete offer info', async () => {
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockPremiumOffer as any);

      const result = await service.getOfferInfo(OfferType.PREMIUM);

      expect(result).toBeDefined();
      expect(result.type).toBe(OfferType.PREMIUM);
      expect(result.name).toBe('Offre Premium');
      expect(result.customizationEnabled).toBe(true);
      expect(result.modules).toBeDefined();
      expect(Array.isArray(result.modules)).toBe(true);
    });
  });

  describe('getAllOffersInfo', () => {
    it('should return info for all available offers', async () => {
      jest
        .spyOn(offerRepository, 'findOne')
        .mockResolvedValueOnce(mockBasicOffer as any)
        .mockResolvedValueOnce(mockPremiumOffer as any);

      const result = await service.getAllOffersInfo();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('offerExists', () => {
    it('should return true if offer exists', async () => {
      jest.spyOn(offerRepository, 'count').mockResolvedValue(1);

      const result = await service.offerExists(OfferType.BASIC);

      expect(result).toBe(true);
    });

    it('should return false if offer does not exist', async () => {
      jest.spyOn(offerRepository, 'count').mockResolvedValue(0);

      const result = await service.offerExists(OfferType.BASIC);

      expect(result).toBe(false);
    });
  });
});

describe('OfferChangeService', () => {
  let service: OfferChangeService;
  let changeHistoryRepository: Repository<ClientOfferChangeHistory>;
  let clientRepository: Repository<Client>;
  let clientModuleRepository: Repository<ClientModule>;
  let offerRepository: Repository<Offer>;

  const mockClientId = '550e8400-e29b-41d4-a716-446655440000';
  const mockResellerId = 'reseller-123';
  const mockChangeId = 1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfferChangeService,
        {
          provide: getRepositoryToken(ClientOfferChangeHistory),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
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
          provide: getRepositoryToken(Offer),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OfferChangeService>(OfferChangeService);
    changeHistoryRepository = module.get<Repository<ClientOfferChangeHistory>>(
      getRepositoryToken(ClientOfferChangeHistory),
    );
    clientRepository = module.get<Repository<Client>>(getRepositoryToken(Client));
    clientModuleRepository = module.get<Repository<ClientModule>>(
      getRepositoryToken(ClientModule),
    );
    offerRepository = module.get<Repository<Offer>>(getRepositoryToken(Offer));
  });

  describe('getChangeHistory', () => {
    it('should return change history for a client', async () => {
      const mockClient = { uid: mockClientId, resellerId: mockResellerId };
      const mockChanges = [
        {
          id: 1,
          fromOffer: OfferType.BASIC,
          toOffer: OfferType.PREMIUM,
          status: 'pending',
        },
      ];

      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(mockClient as any);
      jest
        .spyOn(changeHistoryRepository, 'findAndCount')
        .mockResolvedValue([mockChanges, 1] as any);

      const result = await service.getChangeHistory(mockClientId, mockResellerId);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw if client not found', async () => {
      jest.spyOn(clientRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getChangeHistory(mockClientId, mockResellerId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('previewOfferChange', () => {
    it('should preview offer change with module additions and removals', async () => {
      const mockClient = { uid: mockClientId, resellerId: mockResellerId };
      const mockChange = {
        id: mockChangeId,
        client: mockClient,
        fromOffer: OfferType.BASIC,
        toOffer: OfferType.PREMIUM,
        status: 'pending',
        effectiveDate: new Date(),
        createdAt: new Date(),
      };
      const mockOffer = { type: OfferType.PREMIUM, customizationEnabled: true };

      jest
        .spyOn(changeHistoryRepository, 'findOne')
        .mockResolvedValue(mockChange as any);
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer as any);

      const result = await service.previewOfferChange(mockChangeId, mockResellerId);

      expect(result).toBeDefined();
      expect(result.currentOffer).toBe(OfferType.BASIC);
      expect(result.newOffer).toBe(OfferType.PREMIUM);
      expect(Array.isArray(result.modulesAdded)).toBe(true);
      expect(Array.isArray(result.modulesRemoved)).toBe(true);
    });

    it('should throw if change not found', async () => {
      jest.spyOn(changeHistoryRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.previewOfferChange(mockChangeId, mockResellerId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should disable customization when downgrading to offer without it', async () => {
      const mockClient = { uid: mockClientId, resellerId: mockResellerId };
      const mockChange = {
        id: mockChangeId,
        client: mockClient,
        fromOffer: OfferType.PREMIUM,
        toOffer: OfferType.BASIC,
        status: 'pending',
        effectiveDate: new Date(),
        createdAt: new Date(),
      };
      const mockOffer = { type: OfferType.BASIC, customizationEnabled: false };

      jest
        .spyOn(changeHistoryRepository, 'findOne')
        .mockResolvedValue(mockChange as any);
      jest.spyOn(offerRepository, 'findOne').mockResolvedValue(mockOffer as any);

      const result = await service.previewOfferChange(mockChangeId, mockResellerId);

      expect(result.customizationEnabled).toBe(false);
      expect(result.warnings).toContain('Customization will be removed for this offer');
    });
  });

  describe('applyOfferChange', () => {
    it('should apply a pending offer change', async () => {
      const mockClient = {
        uid: mockClientId,
        resellerId: mockResellerId,
        offerType: OfferType.BASIC,
      };
      const mockChange = {
        id: mockChangeId,
        client: mockClient,
        fromOffer: OfferType.BASIC,
        toOffer: OfferType.PREMIUM,
        status: 'pending',
        appliedAt: null,
      };

      jest
        .spyOn(changeHistoryRepository, 'findOne')
        .mockResolvedValue(mockChange as any);
      jest.spyOn(clientRepository, 'save').mockResolvedValue(mockClient as any);
      jest.spyOn(clientModuleRepository, 'delete').mockResolvedValue({} as any);
      jest.spyOn(clientModuleRepository, 'save').mockResolvedValue([
        { moduleKey: ModuleKey.VISIO_JITSI },
      ] as any);
      jest
        .spyOn(changeHistoryRepository, 'save')
        .mockResolvedValue({ ...mockChange, status: 'applied', createdAt: new Date() } as any);

      const result = await service.applyOfferChange(mockChangeId, mockResellerId);

      expect(result.status).toBe('applied');
      expect(result.clientUid).toBe(mockClientId);
      expect(clientRepository.save).toHaveBeenCalled();
    });

    it('should throw if change is not pending', async () => {
      const mockClient = { uid: mockClientId, resellerId: mockResellerId };
      const mockChange = {
        id: mockChangeId,
        client: mockClient,
        status: 'applied',
      };

      jest
        .spyOn(changeHistoryRepository, 'findOne')
        .mockResolvedValue(mockChange as any);

      await expect(
        service.applyOfferChange(mockChangeId, mockResellerId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if change belongs to different reseller', async () => {
      const mockClient = { uid: mockClientId, resellerId: 'different-reseller' };
      const mockChange = {
        id: mockChangeId,
        client: mockClient,
        status: 'pending',
      };

      jest
        .spyOn(changeHistoryRepository, 'findOne')
        .mockResolvedValue(mockChange as any);

      await expect(
        service.applyOfferChange(mockChangeId, mockResellerId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelOfferChange', () => {
    it('should cancel a pending offer change', async () => {
      const mockClient = { uid: mockClientId, resellerId: mockResellerId };
      const mockChange = {
        id: mockChangeId,
        client: mockClient,
        fromOffer: OfferType.BASIC,
        toOffer: OfferType.PREMIUM,
        status: 'pending',
        appliedAt: null,
      };

      jest
        .spyOn(changeHistoryRepository, 'findOne')
        .mockResolvedValue(mockChange as any);
      jest
        .spyOn(changeHistoryRepository, 'save')
        .mockResolvedValue({ ...mockChange, status: 'cancelled' } as any);

      const result = await service.cancelOfferChange(mockChangeId, mockResellerId);

      expect(result.status).toBe('cancelled');
      expect(changeHistoryRepository.save).toHaveBeenCalled();
    });

    it('should throw if change is not pending', async () => {
      const mockClient = { uid: mockClientId, resellerId: mockResellerId };
      const mockChange = {
        id: mockChangeId,
        client: mockClient,
        status: 'applied',
      };

      jest
        .spyOn(changeHistoryRepository, 'findOne')
        .mockResolvedValue(mockChange as any);

      await expect(
        service.cancelOfferChange(mockChangeId, mockResellerId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cleanupExpiredChanges', () => {
    it('should cleanup expired pending changes', async () => {
      jest.spyOn(changeHistoryRepository, 'delete').mockResolvedValue({
        affected: 5,
      } as any);

      const result = await service.cleanupExpiredChanges(30);

      expect(result).toBe(5);
      expect(changeHistoryRepository.delete).toHaveBeenCalled();
    });

    it('should return 0 if no changes deleted', async () => {
      jest.spyOn(changeHistoryRepository, 'delete').mockResolvedValue({
        affected: 0,
      } as any);

      const result = await service.cleanupExpiredChanges(30);

      expect(result).toBe(0);
    });
  });

  describe('getPendingChangesReadyToApply', () => {
    it('should return pending changes past effective date', async () => {
      const mockChanges = [
        {
          id: 1,
          status: 'pending',
          effectiveDate: new Date('2025-01-01'),
          client: { uid: mockClientId, resellerId: mockResellerId },
        },
      ];

      jest.spyOn(changeHistoryRepository, 'find').mockResolvedValue(mockChanges as any);

      const result = await service.getPendingChangesReadyToApply();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });
  });
});
