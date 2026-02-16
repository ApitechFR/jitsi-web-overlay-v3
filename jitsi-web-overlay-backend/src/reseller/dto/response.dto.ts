import { OfferType } from '../enums/offer-type.enum';
import { ModuleKey } from '../enums/module-key.enum';

/**
 * Response DTO for client details
 */
export class ClientResponseDto {
    uid: string;
    name: string;
    offerType: OfferType;
    domains: string[];
    customization?: {
        logo?: string;
        logoSmall?: string;
        logoDarkMode?: string;
        favicon?: string;
        appName?: string;
    };
    modules: ModuleKey[];
    authConfig?: {
        type: 'oidc';
        oidcUrl?: string;
        oidcClientId?: string;
        ldapUrl?: string;
        ldapBindDn?: string;
        ldapBaseDn?: string;
    };
    limits?: {
        maxParticipants?: number;
        replayRetentionDays?: number;
    };
    stats?: {
        usersCount: number;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deactivatedAt?: Date;
}

/**
 * Summary DTO for client listing (without details)
 */
export class ClientSummaryDto {
    uid: string;
    name: string;
    domains: string[];
    offerType: OfferType;
    usersCount: number;
    isActive: boolean;
    createdAt: Date;
}

/**
 * Information about offers for response
 */
export class OfferInfoDto {
    type: OfferType;
    name: string;
    description: string;
    modules: ModuleKey[];
    customizationEnabled: boolean;
    limits?: {
        maxParticipants?: number;
        replayRetentionDays?: number;
    };
}

/**
 * Paginated response DTO for listing clients or offers
 */
export class PaginatedResponseDto<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

/**
 * Preview of changes when switching offers (BASIC → PREMIUM or PREMIUM → BASIC)
 */
export class OfferChangePreviewDto {
    currentOffer: OfferType;
    newOffer: OfferType;
    modulesAdded: ModuleKey[];
    modulesRemoved: ModuleKey[];
    customizationEnabled: boolean;
    warnings: string[];
    effectiveDate?: Date;
}

/**
 * Response DTO for offer change operations (upgrade/downgrade)
 */
export class OfferChangeResponseDto {
    id: number;
    clientUid: string;
    fromOffer: OfferType;
    toOffer: OfferType;
    status: 'pending' | 'applied' | 'cancelled';
    effectiveDate?: Date;
    createdAt: Date;
    appliedAt?: Date;
}
