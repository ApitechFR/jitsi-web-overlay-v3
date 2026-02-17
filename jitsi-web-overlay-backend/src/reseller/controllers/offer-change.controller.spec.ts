import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { OfferChangeController } from './offer-change.controller';
import { OfferChangeService } from '../services/offer-change.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { ApiKeyService } from '../services/api-key.service';
import { TenantContext } from '../../common/context/tenant.context';
import { OfferType } from '../enums/offer-type.enum';

describe('OfferChangeController', () => {
  let controller: OfferChangeController;
  let service: OfferChangeService;

  const mockResellerId = 'reseller-123';
  const mockClientId = '550e8400-e29b-41d4-a716-446655440000';
  const mockChangeId = 1;

  const mockChange = {
    id: mockChangeId,
    status: 'pending',
    fromOffer: OfferType.BASIC,
    toOffer: OfferType.PREMIUM,
    createdAt: new Date(),
  };

  const mockPreview = {
    currentOffer: OfferType.BASIC,
    newOffer: OfferType.PREMIUM,
    modulesAdded: ['feedback', 'webinar'],
    modulesRemoved: [],
    customizationEnabled: true,
    warnings: [],
    effectiveDate: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfferChangeController],
      providers: [
        {
          provide: OfferChangeService,
          useValue: {
            getChangeHistory: jest.fn(),
            previewOfferChange: jest.fn(),
            applyOfferChange: jest.fn(),
            cancelOfferChange: jest.fn(),
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

    controller = module.get<OfferChangeController>(OfferChangeController);
    service = module.get<OfferChangeService>(OfferChangeService);
  });

  describe('GET /reseller/clients/:clientId/offer-changes', () => {
    it('should get change history for a client', async () => {
      jest.spyOn(service, 'getChangeHistory').mockResolvedValue({
        data: [mockChange],
        total: 1,
      } as any);

      const result = await controller.getChangeHistory(
        mockClientId,
        { page: 1, limit: 20 },
        mockResellerId,
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pages).toBe(1);
      expect(service.getChangeHistory).toHaveBeenCalledWith(
        mockClientId,
        mockResellerId,
        1,
        20,
      );
    });

    it('should handle default pagination', async () => {
      jest.spyOn(service, 'getChangeHistory').mockResolvedValue({
        data: [],
        total: 0,
      } as any);

      const result = await controller.getChangeHistory(
        mockClientId,
        {},
        mockResellerId,
      );

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(service.getChangeHistory).toHaveBeenCalledWith(
        mockClientId,
        mockResellerId,
        1,
        20,
      );
    });
  });

  describe('GET /reseller/offer-changes/:changeId', () => {
    it('should preview an offer change', async () => {
      jest.spyOn(service, 'previewOfferChange').mockResolvedValue(mockPreview as any);

      const result = await controller.previewChange(
        mockChangeId.toString(),
        mockResellerId,
      );

      expect(result).toBeDefined();
      expect(result.currentOffer).toBe(OfferType.BASIC);
      expect(result.newOffer).toBe(OfferType.PREMIUM);
      expect(Array.isArray(result.modulesAdded)).toBe(true);
      expect(service.previewOfferChange).toHaveBeenCalledWith(
        mockChangeId,
        mockResellerId,
      );
    });
  });

  describe('POST /reseller/offer-changes/:changeId/apply', () => {
    it('should apply an offer change', async () => {
      const appliedChange = {
        id: mockChangeId,
        clientUid: mockClientId,
        fromOffer: OfferType.BASIC,
        toOffer: OfferType.PREMIUM,
        status: 'applied',
        appliedAt: new Date(),
      };
      jest.spyOn(service, 'applyOfferChange').mockResolvedValue(appliedChange as any);

      const result = await controller.applyChange(
        mockChangeId.toString(),
        mockResellerId,
      );

      expect(result.status).toBe('applied');
      expect(result.clientUid).toBe(mockClientId);
      expect(service.applyOfferChange).toHaveBeenCalledWith(
        mockChangeId,
        mockResellerId,
      );
    });
  });

  describe('POST /reseller/offer-changes/:changeId/cancel', () => {
    it('should cancel an offer change', async () => {
      const cancelledChange = {
        id: mockChangeId,
        clientUid: mockClientId,
        fromOffer: OfferType.BASIC,
        toOffer: OfferType.PREMIUM,
        status: 'cancelled',
      };
      jest.spyOn(service, 'cancelOfferChange').mockResolvedValue(cancelledChange as any);

      const result = await controller.cancelChange(
        mockChangeId.toString(),
        mockResellerId,
      );

      expect(result.status).toBe('cancelled');
      expect(service.cancelOfferChange).toHaveBeenCalledWith(
        mockChangeId,
        mockResellerId,
      );
    });
  });
});
