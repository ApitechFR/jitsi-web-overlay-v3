import { Injectable } from '@nestjs/common';
import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';

/**
 * Validator to check that a domain is used by only 1 client
 *  (TODO: Injecter ClientRepository pour vérifier en BD)
 */
@ValidatorConstraint({ name: 'isUniqueDomain', async: true })
@Injectable()
export class IsUniqueDomainConstraint implements ValidatorConstraintInterface {
    async validate(value: string, args: ValidationArguments): Promise<boolean> {
        // TODO: Injecter ClientRepository
        // const existing = await this.clientRepository.findByDomain(value, excludeClientId);
        // return !existing;

        // Pour maintenant, passer (implémenté en BD via UNIQUE INDEX)
        return true;
    }

    defaultMessage(args: ValidationArguments): string {
        return `Domaine "${args.value}" est déjà utilisé par un autre client`;
    }
}


/**
 * Decorator to validate that a domain is unique (not used by another client)
 * @param validationOptions 
 * @returns 
 */
export function IsUniqueDomain(validationOptions?: ValidationOptions) {
    return function (target: Object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
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
        return 'domaine doit être un format valide (ex: "apitech.fr")';
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
        return ['basique', 'premium'].includes(value);
    }

    defaultMessage(args: ValidationArguments): string {
        return `offerType "${args.value}" n'existe pas. Valeurs acceptées: basique, premium`;
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
