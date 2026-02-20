import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateClientDto, UpdateClientDto, UpgradeClientDto, DowngradeClientDto } from './client.dto';
import { OfferType } from '../enums/offer-type.enum';

describe('Client DTOs', () => {
    describe('CreateClientDto', () => {
        it('should validate a valid CreateClientDto', async () => {
            const dto = plainToClass(CreateClientDto, {
                name: 'Test Client',
                offerType: OfferType.BASIC,
                domains: [{ domain: 'example.fr' }],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail if name is missing', async () => {
            const dto = plainToClass(CreateClientDto, {
                offerType: OfferType.BASIC,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('name');
        });

        it('should fail if name exceeds max length', async () => {
            const dto = plainToClass(CreateClientDto, {
                name: 'a'.repeat(256),
                offerType: OfferType.BASIC,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should fail if offerType is invalid', async () => {
            const dto = plainToClass(CreateClientDto, {
                name: 'Test Client',
                offerType: 'INVALID',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should validate domains if provided', async () => {
            const dto = plainToClass(CreateClientDto, {
                name: 'Test Client',
                offerType: OfferType.PREMIUM,
                domains: [{ domain: 'valid.fr' }, { domain: 'another.com' }],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail if domain format is invalid', async () => {
            const dto = plainToClass(CreateClientDto, {
                name: 'Test Client',
                offerType: OfferType.BASIC,
                domains: [{ domain: 'invalid_domain' }],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('UpdateClientDto', () => {
        it('should validate a valid UpdateClientDto', async () => {
            const dto = plainToClass(UpdateClientDto, {
                name: 'Updated Name',
                domains: [{ domain: 'updated.fr' }],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should allow empty UpdateClientDto (all optional)', async () => {
            const dto = plainToClass(UpdateClientDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('UpgradeClientDto', () => {
        it('should validate a valid UpgradeClientDto', async () => {
            const dto = plainToClass(UpgradeClientDto, {
                customization: {
                    appName: 'Premium App',
                },
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should allow empty UpgradeClientDto', async () => {
            const dto = plainToClass(UpgradeClientDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('DowngradeClientDto', () => {
        it('should validate a valid DowngradeClientDto', async () => {
            const dto = plainToClass(DowngradeClientDto, {
                deleteReplays: true,
                exportStats: true,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should allow empty DowngradeClientDto', async () => {
            const dto = plainToClass(DowngradeClientDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });
});
