import { Injectable } from '@nestjs/common';
import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';

/**
 * Validateur pour vérifier qu'un domaine n'est utilisé que par 1 client
 * (TODO: Injecter ClientRepository pour vérifier en BD)
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
 * Décorateur pour valider l'unicité d'un domaine
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
 * Validateur pour format d'email domain
 * Acceptable: "uni-paris.fr", "example.co.uk", etc.
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
    return 'domaine doit être un format valide (ex: "uni-paris.fr")';
  }
}

/**
 * Décorateur pour valider le format d'un email domain
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
 * Validateur pour l'existence d'une offre
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
        return ['BASIQUE', 'PREMIUM'].includes(value);
    }

    defaultMessage(args: ValidationArguments): string {
        return `offerType "${args.value}" n'existe pas. Valeurs acceptées: BASIQUE, PREMIUM`;
    }
}

/**
 * Décorateur pour valider une offre existante
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
