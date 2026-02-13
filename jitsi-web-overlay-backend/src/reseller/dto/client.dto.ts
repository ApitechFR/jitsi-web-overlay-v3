import { IsString, IsNotEmpty, IsOptional, IsArray, MaxLength, Matches, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { OfferType } from '../enums/offer-type.enum';
import { AuthConfigDto, CustomizationDto } from './shared.dto';

/**
 * Create client DTO
 */
export class CreateClientDto {
    @IsString()
    @IsNotEmpty({ message: 'name est requis' })
    @MaxLength(255)
    name: string;

    @IsEnum(OfferType, { message: `offerType doit être l'un de: ${Object.values(OfferType).join(', ')}` })
    @IsNotEmpty({ message: 'offerType est requis' })
    offerType: OfferType;

    @IsOptional()
    @IsArray()
    @Matches(/^[\w.-]+\.[a-z]{2,}$/i, {
        each: true,
        message: 'Chaque domaine doit être un email domain valide (ex: "apitech.fr")',
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
        message: 'Chaque domaine doit être un email domain valide (ex: "apitech.fr")',
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
    @IsOptional()
    effectiveDate?: Date;

    @IsOptional()
    deleteReplays?: boolean = false;

    @IsOptional()
    deleteRecordings?: boolean = false;

    @IsOptional()
    exportStats?: boolean = false;
}
