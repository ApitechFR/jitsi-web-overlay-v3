import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../entities/offer.entity';
import { OfferType } from '../enums/offer-type.enum';
import { ModuleKey } from '../enums/module-key.enum';

/**
 * Seed service for initializing default offers
 * Runs at module initialization to ensure offers exist in DB
 */
@Injectable()
export class OfferSeedService implements OnModuleInit {
    private readonly logger = new Logger('OfferSeedService');

    constructor(
        @InjectRepository(Offer)
        private readonly offerRepository: Repository<Offer>,
    ) { }

    async onModuleInit() {
        await this.seedOffers();
    }

    async seedOffers(): Promise<void> {
        try {
            // Check if offers already exist
            const existingOffers = await this.offerRepository.count();

            if (existingOffers >= 2) {
                this.logger.debug('Offers already seeded, skipping...');
                return;
            }

            this.logger.log('Seeding default offers...');

            // BASIC offer
            const basic = this.offerRepository.create({
                type: OfferType.BASIC,
                name: 'Basic Offer',
                description: 'Essential modules: video and feedback',
                modules: [ModuleKey.VISIO_JITSI, ModuleKey.FEEDBACK],
                limits: {
                    maxParticipants: null,
                    replayRetentionDays: null,
                },
                customizationEnabled: false,
            });

            await this.offerRepository.save(basic);
            this.logger.log('Seeded BASIC offer');

            // PREMIUM offer
            const premium = this.offerRepository.create({
                type: OfferType.PREMIUM,
                name: 'Premium Offer',
                description: 'All modules: video, feedback, webinar, replay, recording, whiteboard',
                modules: [
                    ModuleKey.VISIO_JITSI,
                    ModuleKey.FEEDBACK,
                    ModuleKey.WEBINAR,
                    ModuleKey.REPLAY,
                    ModuleKey.RECORDING,
                    ModuleKey.WHITEBOARD,
                ],
                limits: {
                    maxParticipants: null,
                    replayRetentionDays: null,
                },
                customizationEnabled: true,
            });

            await this.offerRepository.save(premium);
            this.logger.log('Seeded PREMIUM offer');

            this.logger.log('All offers seeded successfully!');
        } catch (error) {
            this.logger.error('Error seeding offers:', error);
            throw error;
        }
    }
}
