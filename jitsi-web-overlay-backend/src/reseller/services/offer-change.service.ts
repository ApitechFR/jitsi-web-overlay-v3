import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ClientOfferChangeHistory } from '../entities/client-offer-change-history.entity';
import { Client } from '../entities/client.entity';
import { ClientModule } from '../entities/client-module.entity';
import { Offer } from '../entities/offer.entity';
import { OfferType } from '../enums/offer-type.enum';
import { ModuleKey, OFFER_MODULES } from '../enums/module-key.enum';
import { OfferChangeResponseDto, OfferChangePreviewDto } from '../dto/response.dto';

@Injectable()
export class OfferChangeService {
  constructor(
    @InjectRepository(ClientOfferChangeHistory)
    private readonly changeHistoryRepository: Repository<ClientOfferChangeHistory>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(ClientModule)
    private readonly clientModuleRepository: Repository<ClientModule>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
  ) {}

  /**
   * Get offer change history for a client
   */
  async getChangeHistory(
    clientId: string,
    resellerId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ClientOfferChangeHistory[]; total: number }> {
    const skip = (page - 1) * limit;

    // Verify client exists and belongs to reseller
    const client = await this.clientRepository.findOne({
      where: { uid: clientId, resellerId },
    });

    if (!client) {
      throw new NotFoundException(
        `Client with ID ${clientId} not found for this reseller`,
      );
    }

    const [changes, total] = await this.changeHistoryRepository.findAndCount({
      where: { client: { uid: clientId } },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data: changes, total };
  }

  /**
   * Preview what will change when upgrading/downgrading
   */
  async previewOfferChange(
    changeHistoryId: number,
    resellerId: string,
  ): Promise<OfferChangePreviewDto> {
    const change = await this.changeHistoryRepository.findOne({
      where: { id: changeHistoryId },
      relations: ['client'],
    });

    if (!change) {
      throw new NotFoundException(`Offer change with ID ${changeHistoryId} not found`);
    }

    // Verify client belongs to reseller
    if (change.client.resellerId !== resellerId) {
      throw new BadRequestException(
        'Offer change does not belong to this reseller',
      );
    }

    // Get modules for both offers
    const fromModules = OFFER_MODULES[change.fromOffer] || [];
    const toModules = OFFER_MODULES[change.toOffer] || [];

    // Calculate what modules will be added/removed
    const modulesAdded = toModules.filter((m) => !fromModules.includes(m));
    const modulesRemoved = fromModules.filter((m) => !toModules.includes(m));

    // Get customization availability
    const toOffer = await this.offerRepository.findOne({
      where: { type: change.toOffer },
    });

    const warnings: string[] = [];
    if (!toOffer?.customizationEnabled && modulesRemoved.length > 0) {
      warnings.push('Customization will be removed for this offer');
    }

    return {
      currentOffer: change.fromOffer,
      newOffer: change.toOffer,
      modulesAdded,
      modulesRemoved,
      customizationEnabled: toOffer?.customizationEnabled || false,
      warnings,
      effectiveDate: change.effectiveDate,
    };
  }

  /**
   * Apply a pending offer change
   * Updates client offer type, updates module list, applies customization changes
   */
  async applyOfferChange(
    changeHistoryId: number,
    resellerId: string,
  ): Promise<OfferChangeResponseDto> {
    const change = await this.changeHistoryRepository.findOne({
      where: { id: changeHistoryId },
      relations: ['client'],
    });

    if (!change) {
      throw new NotFoundException(`Offer change with ID ${changeHistoryId} not found`);
    }

    // Verify client belongs to reseller
    if (change.client.resellerId !== resellerId) {
      throw new BadRequestException(
        'Offer change does not belong to this reseller',
      );
    }

    // Check status
    if (change.status !== 'pending') {
      throw new BadRequestException(
        `Cannot apply offer change with status ${change.status}`,
      );
    }

    const client = change.client;

    // Update client offer type
    client.offerType = change.toOffer;
    await this.clientRepository.save(client);

    // Update modules: remove old, add new
    const fromModules = OFFER_MODULES[change.fromOffer] || [];
    const toModules = OFFER_MODULES[change.toOffer] || [];

    // Remove modules no longer in new offer
    const modulesToRemove = fromModules.filter((m) => !toModules.includes(m));
    if (modulesToRemove.length > 0) {
      await this.clientModuleRepository.delete({
        client: { uid: client.uid },
        moduleKey: modulesToRemove as any,
      });
    }

    // Add new modules not in old offer
    const modulesToAdd = toModules.filter((m) => !fromModules.includes(m));
    if (modulesToAdd.length > 0) {
      const newModules = modulesToAdd.map((moduleKey) => {
        const mod = new ClientModule();
        mod.client = client;
        mod.moduleKey = moduleKey;
        mod.enabled = true;
        return mod;
      });
      await this.clientModuleRepository.save(newModules);
    }

    // Update change history status
    change.status = 'applied';
    change.appliedAt = new Date();
    const updatedChange = await this.changeHistoryRepository.save(change);

    return {
      id: updatedChange.id,
      clientUid: client.uid,
      fromOffer: updatedChange.fromOffer,
      toOffer: updatedChange.toOffer,
      status: updatedChange.status,
      appliedAt: updatedChange.appliedAt,
      createdAt: updatedChange.createdAt,
    };
  }

  /**
   * Cancel a pending offer change
   */
  async cancelOfferChange(
    changeHistoryId: number,
    resellerId: string,
  ): Promise<OfferChangeResponseDto> {
    const change = await this.changeHistoryRepository.findOne({
      where: { id: changeHistoryId },
      relations: ['client'],
    });

    if (!change) {
      throw new NotFoundException(`Offer change with ID ${changeHistoryId} not found`);
    }

    // Verify client belongs to reseller
    if (change.client.resellerId !== resellerId) {
      throw new BadRequestException(
        'Offer change does not belong to this reseller',
      );
    }

    // Check status
    if (change.status !== 'pending') {
      throw new BadRequestException(
        `Cannot cancel offer change with status ${change.status}`,
      );
    }

    // Update change history status
    change.status = 'cancelled';
    const updatedChange = await this.changeHistoryRepository.save(change);

    return {
      id: updatedChange.id,
      clientUid: change.client.uid,
      fromOffer: updatedChange.fromOffer,
      toOffer: updatedChange.toOffer,
      status: updatedChange.status,
      appliedAt: updatedChange.appliedAt,
      createdAt: updatedChange.createdAt,
    };
  }

  /**
   * Cleanup expired offer changes (older than 30 days, not applied/cancelled)
   */
  async cleanupExpiredChanges(daysOld: number = 30): Promise<number> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - daysOld);

    const result = await this.changeHistoryRepository.delete({
      status: 'pending',
      createdAt: LessThan(expirationDate),
    });

    return result.affected || 0;
  }

  /**
   * Get pending changes that are ready to be applied (past effective date)
   */
  async getPendingChangesReadyToApply(): Promise<ClientOfferChangeHistory[]> {
    const now = new Date();

    return this.changeHistoryRepository.find({
      where: {
        status: 'pending',
        effectiveDate: LessThan(now),
      },
      relations: ['client'],
      order: { effectiveDate: 'ASC' },
    });
  }
}
