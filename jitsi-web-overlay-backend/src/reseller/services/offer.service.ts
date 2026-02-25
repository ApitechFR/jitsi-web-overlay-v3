import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../entities/offer.entity';
import { OfferType } from '../enums/offer-type.enum';
import { ModuleKey, OFFER_MODULES } from '../enums/module-key.enum';
import { OfferInfoDto } from '../dto/response.dto';

@Injectable()
export class OfferService {
  private readonly logger = new Logger(OfferService.name);

  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
  ) { }

  /**
   * Get all available offers
   */
  async getAllOffers(): Promise<Offer[]> {
    return this.offerRepository.find({ order: { createdAt: 'ASC' } });
  }

  /**
   * Get offer by type
   */
  async getOfferByType(type: OfferType): Promise<Offer> {
    const offer = await this.offerRepository.findOne({ where: { type } });

    if (!offer) {
      throw new NotFoundException(`Offer type ${type} not found`);
    }

    return offer;
  }

  /**
   * Get modules included in an offer
   */
  async getOfferModules(type: OfferType): Promise<ModuleKey[]> {
    const offer = await this.getOfferByType(type);

    // Get module list from enum mapping
    const modules = OFFER_MODULES[type];
    if (!modules) {
      return [];
    }

    return modules;
  }

  /**
   * Get complete offer info with modules and customization availability
   */
  async getOfferInfo(type: OfferType): Promise<OfferInfoDto> {
    const offer = await this.getOfferByType(type);
    const modules = OFFER_MODULES[type] || [];

    return {
      type: offer.type,
      name: offer.name,
      description: offer.description,
      modules: modules,
      customizationEnabled: offer.customizationEnabled,
      limits: offer.limits,
    };
  }

  /**
   * Get all offer info at once
   */
  async getAllOffersInfo(): Promise<OfferInfoDto[]> {
    const offerTypes = Object.values(OfferType);
    const offerInfos: OfferInfoDto[] = [];

    for (const type of offerTypes) {
      try {
        const info = await this.getOfferInfo(type);
        offerInfos.push(info);
      } catch (error) {
        // Skip offers that don't have data in DB
        this.logger.warn(`Offer type ${type} not found in database, skipping...`, error instanceof Error ? error.message : String(error));
      }
    }

    return offerInfos;
  }

  /**
   * Check if offer exists
   */
  async offerExists(type: OfferType): Promise<boolean> {
    const count = await this.offerRepository.count({ where: { type } });
    return count > 0;
  }
}
