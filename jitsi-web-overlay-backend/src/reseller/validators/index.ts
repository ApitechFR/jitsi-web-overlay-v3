import { Injectable } from '@nestjs/common';
import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';
import { ClientDomainRepository } from '../repositories/client-domain.repository';

/**
 * Validator to check that a domain is used by only 1 client
 * Injects ClientDomainRepository for database verification
 */
@ValidatorConstraint({ name: 'isUniqueDomain', async: true })
@Injectable()
export class IsUniqueDomainConstraint implements ValidatorConstraintInterface {
    constructor(private readonly clientDomainRepository: ClientDomainRepository) { }

    async validate(value: string, args: ValidationArguments): Promise<boolean> {
        // Extract optional clientId from constraints (for update operations)
        const clientId = args.constraints?.[0];

        // Check if domain is unique
        return this.clientDomainRepository.isUnique(value, clientId);
    }

    defaultMessage(args: ValidationArguments): string {
        return `Domain "${args.value}" is already used by another client. Each client must have a unique domain.`;
    }
}

/**
 * Decorator to validate that a domain is unique (not used by another client)
 * @param excludeClientId Optional: exclude a specific client ID (useful for updates)
 * @param validationOptions 
 * @returns 
 */
export function IsUniqueDomain(excludeClientId?: number, validationOptions?: ValidationOptions) {
    return function (target: Object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: excludeClientId ? [excludeClientId] : [],
            validator: IsUniqueDomainConstraint,
        });
    };
}


/**
 * Validator for email domain format
 * Acceptable: "apitech.fr", "subdomain.apitech.fr"
 * Format: word chars/hyphens (not dots) + dot + word chars/hyphens (not dots) + ... + TLD (2-6 chars)
 */
@ValidatorConstraint({ name: 'isValidEmailDomain' })
export class IsValidEmailDomainConstraint implements ValidatorConstraintInterface {
    validate(value: string): boolean {
        // Format: [word-]+ . [word-]+ . ... . [a-z]{2,6}
        // No leading/trailing dots, no consecutive dots, no spaces
        return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,6}$/i.test(value);
    }

    defaultMessage(): string {
        return 'domain must be a valid format (e.g.,   "apitech.fr")';
    }
}

/**
 * Decorator to validate email domain format
 * @param validationOptions 
 * @returns 
 */
export function IsValidEmailDomain(validationOptions?: ValidationOptions) {
    return function (target: Object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidEmailDomainConstraint,
        });
    };
}

/**
 * Validator for offer existence
 * (TODO: Injecter OfferRepository pour vérifier en BD)
 */
@ValidatorConstraint({ name: 'isValidOfferType', async: true })
@Injectable()
export class IsValidOfferTypeConstraint implements ValidatorConstraintInterface {
    async validate(value: string): Promise<boolean> {
        // TODO: Injecter OfferRepository
        // const offer = await this.offerRepository.findByType(value);
        // return !!offer;

        // Pour maintenant, vérifier contre enum
        return ['basic', 'premium'].includes(value);
    }

    defaultMessage(args: ValidationArguments): string {
        return `offerType "${args.value}" is not a valid offer type. Accepted values: basic, premium`;
    }
}


/**
 * Decorator to validate that an offer type exists
 * @param validationOptions 
 * @returns 
 */
export function IsValidOfferType(validationOptions?: ValidationOptions) {
    return function (target: Object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidOfferTypeConstraint,
        });
    };
}
