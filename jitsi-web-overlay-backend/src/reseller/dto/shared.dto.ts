import { IsString, IsOptional, IsEmail, IsEnum, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Authentification configuration for a client
 * Supports OIDC authentication
 */
export class AuthConfigDto {
    @IsEnum(['oidc'], {
        message: "Type must be 'oidc'",
    })
    type: 'oidc';

    // OIDC fields
    @IsOptional()
    @IsString()
    oidcUrl?: string;

    @IsOptional()
    @IsString()
    oidcClientId?: string;

    @IsOptional()
    @IsString()
    oidcClientSecret?: string;

    @IsOptional()
    @IsString()
    oidcScope?: string;

    // LDAP fields
    @IsOptional()
    @IsString()
    ldapUrl?: string;

    @IsOptional()
    @IsString()
    ldapBindDn?: string;

    @IsOptional()
    @IsString()
    ldapPassword?: string;

    @IsOptional()
    @IsString()
    ldapBaseDn?: string;
}

/**
 * Custmization options for a client (branding, etc.)
 * Available only for PREMIUM clients
 */
export class CustomizationDto {
    @IsOptional()
    @IsString({ message: 'logo must be a valid URL' })
    logo?: string;

    @IsOptional()
    @IsString()
    logoSmall?: string;

    @IsOptional()
    @IsString()
    logoDarkMode?: string;

    @IsOptional()
    @IsString()
    favicon?: string;

    @IsOptional()
    @IsString({ message: 'appName maximum 50 characters' })
    appName?: string;
}

/**
 * Pagination settings for listing endpoints (clients, offers, etc.) 
 */
export class PaginationDto {
    @IsOptional()
    page?: number = 1;

    @IsOptional()
    limit?: number = 20;

    @IsOptional()
    @IsString()
    search?: string;
}
