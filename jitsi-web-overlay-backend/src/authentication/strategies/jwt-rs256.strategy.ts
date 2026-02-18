import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TenantContext } from '../../common/context/tenant.context';
import { UsersService } from '../../users/users.service';
import { ClientDomainRepository } from '../../reseller/repositories/client-domain.repository';

/**
 * JwtRs256Strategy - Stratégie JWT RS256 pour authentification multi-tenant
 *
 * Responsabilités:
 * 1. Valider la signature JWT avec la clé publique Provider
 * 2. Extraire clientId depuis le JWT
 * 3. Résoudre clientId par domaine email si absent du JWT
 * 4. Injecter clientId dans le TenantContext
 * 5. Créer/mettre à jour user si nécessaire
 *
 * Validations:
 * - Signature JWT RS256
 * - Issuer (optionnel)
 * - Audience (optionnel)
 * - Expiration
 *
 * Mode d'activation:
 * - Seulement utilisée si RESELLER_MODE_ENABLED=true
 * - En mode single-tenant, est enregistrée mais pas utilisée par Passport
 */
@Injectable()
export class JwtRs256Strategy extends PassportStrategy(Strategy, 'jwt-rs256') {
    private readonly logger = new Logger(JwtRs256Strategy.name);
    private readonly isMultiTenantMode: boolean;

    constructor(
        private readonly configService: ConfigService,
        private readonly tenantContext: TenantContext,
        private readonly usersService: UsersService,
        private readonly clientDomainRepository: ClientDomainRepository,
    ) {
        // Retrieve the reseller mode BEFORE calling super()
        const resellerModeEnabled = configService.get('RESELLER_MODE_ENABLED') === 'true';

        // Get the public key for JWT validation from config
        const publicKey = configService.get<string>('PROVIDER_JWT_PUBLIC_KEY');

        // En mode single-tenant, les paramètres ne sont pas fortement validés
        // car la clé publique n'est pas requise (OIDC sera utilisé)
        // On utilise des valeurs par défaut pour éviter les erreurs au bootstrap
        const secretOrKey = publicKey || 'PLACEHOLDER_NOT_USED_IN_SINGLE_TENANT_MODE';

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            algorithms: ['RS256'],
            ignoreExpiration: false,
            secretOrKey,
            issuer: configService.get<string>('PROVIDER_JWT_ISSUER'), // optional
            audience: configService.get<string>('PROVIDER_JWT_AUDIENCE'), // optional
            passReqToCallback: false,
        });

        // Assign readonly after super() using Object.defineProperty
        Object.defineProperty(this, 'isMultiTenantMode', {
            value: resellerModeEnabled,
            writable: false,
        });

        if (resellerModeEnabled && !publicKey) {
            this.logger.error(
                'JwtRs256Strategy initialized in RESELLER_MODE_ENABLED but PROVIDER_JWT_PUBLIC_KEY is not set',
            );
        }
    }

    async validate(payload: JwtPayload): Promise<AuthUser> {
        // Safety check: if not in multi-tenant mode, reject
        if (!this.isMultiTenantMode) {
            this.logger.warn(
                'JwtRs256Strategy.validate() called but RESELLER_MODE_ENABLED is false - rejecting',
            );
            throw new UnauthorizedException('JWT RS256 strategy is not enabled in single-tenant mode');
        }

        this.logger.debug(`JwtRs256Strategy.validate() called`, {
            sub: payload.sub,
            clientId: payload.clientId,
            email: payload.email,
            hasClientId: !!payload.clientId,
        });

        // JWT contains clientId
        if (payload.clientId) {
            this.logger.debug(` clientId from JWT`, { clientId: payload.clientId });
            const clientIdStr = String(payload.clientId);
            const user = await this.usersService.findOrCreateUser(
                {
                    email: payload.email,
                    displayName: payload.name || payload.email,
                    authProvider: 'jwt-rs256',
                },
                clientIdStr,
            );

            // Inject clientId into the context
            this.tenantContext.setClientId(clientIdStr);

            return {
                sub: payload.sub,
                email: payload.email,
                clientId: clientIdStr,
                userId: String(user.id),
                authMethod: 'jwt-rs256',
            };
        }

        // ClientId not in JWT, try to resolve by email domain
        if (payload.email?.includes('@')) {
            this.logger.debug(` resolving clientId from email domain`, {
                email: payload.email,
            });

            const emailDomain = payload.email.split('@')[1];
            const clientDomain =
                await this.clientDomainRepository.findByDomainName(emailDomain);

            if (clientDomain) {
                const clientId = String(clientDomain.client.id);
                this.logger.debug(`success: clientId resolved from domain`, {
                    domain: emailDomain,
                    clientId,
                });

                const user = await this.usersService.findOrCreateUser(
                    {
                        email: payload.email,
                        displayName: payload.name || payload.email,
                        authProvider: 'jwt-rs256',
                    },
                    clientId,
                );

                // Inject clientId into the context
                this.tenantContext.setClientId(clientId);

                return {
                    sub: payload.sub,
                    email: payload.email,
                    clientId,
                    userId: String(user.id),
                    authMethod: 'jwt-rs256-domain-resolved',
                };
            }

            // Email domain not mapped to any client
            this.logger.warn(`Email domain not found in ClientDomain`, {
                email: payload.email,
                domain: emailDomain,
            });

            throw new UnauthorizedException(
                `Email domain '${emailDomain}' is not registered for any tenant`,
            );
        }

        // Cannot resolve clientId from JWT or email domain - reject authentication
        this.logger.error(`Case 3: Cannot resolve clientId`, {
            sub: payload.sub,
            email: payload.email,
            clientId: payload.clientId,
        });

        throw new UnauthorizedException(
            'JWT must contain either "clientId" or "email" field for client identification',
        );
    }
}

/**
 * Structure du payload JWT attendu du Provider
 * Exemple:
 * {
 *   sub: 'user-uuid',
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   clientId: 'client-uuid' (optionnel),
 *   iat: 1234567890,
 *   exp: 1234567890 + 3600
 * }
 */
export interface JwtPayload {
    sub: string; // User ID du Provider
    email: string; // Email utilisateur
    name?: string; // Nom affichage
    clientId?: string | number; // UUID client (optionnel, résolu par email domain sinon)
    iat?: number; // Issued At
    exp?: number; // Expiration
}

/**
 * Objet utilisateur authentifié retourné après validation
 */
export interface AuthUser {
    sub: string; // User ID du Provider
    email: string; // Email utilisateur
    clientId: string; // UUID client (toujours résolu)
    userId: string; // UUID utilisateur dans la BD locale
    authMethod: 'jwt-rs256' | 'jwt-rs256-domain-resolved'; // Méthode de résolution
}

