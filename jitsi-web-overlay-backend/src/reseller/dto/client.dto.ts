import { IsString, IsNotEmpty, IsOptional, IsArray, MaxLength, Matches, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { OfferType } from '../enums/offer-type.enum';
import { AuthConfigDto, CustomizationDto } from './shared.dto';

/**
 * Create client DTO
 */
export class CreateClientDto {
    @IsString()
    @IsNotEmpty({ message: 'name is required' })
    @MaxLength(255)
    name: string;

    @IsEnum(OfferType, { message: 'offerType must be one of: basic, premium' })
    @IsNotEmpty({ message: 'offerType is required' })
    offerType: OfferType;

    @IsOptional()
    @IsArray()
    @Matches(/^[\w.-]+\.[a-z]{2,}$/i, {
        each: true,
        message: 'Each domain must be a valid email domain (e.g. "apitech.fr")',
    })
    domains?: string[];

    @IsOptional()
    @ValidateNested()
    @Type(() => AuthConfigDto)
    authConfig?: AuthConfigDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CustomizationDto)
    customization?: CustomizationDto;
}

/**
 * Update client DTO 
 */
export class UpdateClientDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsArray()
    @Matches(/^[\w.-]+\.[a-z]{2,}$/i, {
        each: true,
        message: 'Each domain must be a valid email domain (e.g. "apitech.fr")',
    })
    domains?: string[];

    @IsOptional()
    @ValidateNested()
    @Type(() => AuthConfigDto)
    authConfig?: AuthConfigDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CustomizationDto)
    customization?: CustomizationDto;
}

/**
 *  Upgrade offer DTO (BASIC → PREMIUM)
 */
export class UpgradeClientDto {
    @IsEnum(OfferType, { message: 'toOffer must be one of: basic, premium' })
    @IsNotEmpty({ message: 'toOffer is required' })
    toOffer: OfferType;

    @IsOptional()
    effectiveDate?: Date;

    @IsOptional()
    @ValidateNested()
    @Type(() => CustomizationDto)
    customization?: CustomizationDto;
}

/**
 *  Downgrade offer DTO (PREMIUM → BASIC)
 */
export class DowngradeClientDto {
    @IsEnum(OfferType, { message: 'toOffer must be one of: basic, premium' })
    @IsNotEmpty({ message: 'toOffer is required' })
    toOffer: OfferType;

    @IsOptional()
    effectiveDate?: Date;

    @IsOptional()
    deleteReplays?: boolean;

    @IsOptional()
    deleteRecordings?: boolean;

    @IsOptional()
    exportStats?: boolean;
}
