import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticationService } from '../authentication.service';
import { UsersService } from '../../users/users.service';
import { AuthProvider } from '../../users/entities/users.entity';
import { TenantContext } from '../../common/context/tenant.context';
import { SsoNonceService } from './sso-nonce.service';

/**
 * Service pour gérer le SSO Hybrid POST (Solution 3)
 * 
 * Responsabilités:
 * 1. Valider le nonce (anti-replay)
 * 2. Valider l'origin (CSRF protection)
 * 3. Valider le token JWT RS256
 * 4. Créer/mettre à jour l'utilisateur
 * 5. Générer tokens HS256 de session
 */
@Injectable()
export class SsoLoginService {
    private readonly logger = new Logger(SsoLoginService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly authenticationService: AuthenticationService,
        private readonly usersService: UsersService,
        private readonly tenantContext: TenantContext,
        private readonly ssoNonceService: SsoNonceService,
    ) { }

    /**
     * Traiter un SSO login via JWT RS256 + POST body
     * 
     * Étapes:
     * 1. Valider le nonce (anti-replay)
     * 2. Valider l'origin (referer header)
     * 3. Valider le token JWT RS256
     * 4. Extraire et valider les claims
     * 5. Créer/mettre à jour l'utilisateur
     * 6. Retourner user + redirection target
     */
    async processSsoLogin(
        token: string,
        nonce: string,
        room: string | undefined,
        referer: string | undefined,
    ): Promise<{
        user: any;
        redirectTarget: string;
    }> {
        // 1. NONCE VALIDATION (Anti-replay)
        this.logger.log(`[SSO] Validating nonce: ${nonce.substring(0, 8)}...`);

        if (!this.ssoNonceService.validateAndMarkNonce(nonce)) {
            this.logger.warn(`[SSO] Invalid or already used nonce: ${nonce.substring(0, 8)}...`);
            throw new ForbiddenException('Invalid or already used nonce (replay attack detected)');
        }

        // 2. ORIGIN VALIDATION (CSRF protection)
        this.logger.log(`[SSO] Validating origin: ${referer}`);
        this.validateOrigin(referer);

        // 3. TOKEN VALIDATION (JWT RS256)
        this.logger.log(`[SSO] Validating JWT RS256 token`);
        const tokenPayload = await this.validateTokenRS256(token);

        // 4. CLAIMS VALIDATION
        this.logger.log(`[SSO] Extracting and validating claims from token`);
        const userInfo = this.extractAndValidateClaims(tokenPayload);

        // 5. CREATE/UPDATE USER
        this.logger.log(`[SSO] Creating/updating user: ${userInfo.email}`);
        // Find existing user or create new one
        let user = await this.usersService.findByEmail(userInfo.email);
        if (user) {
            // Update existing user with new name if provided
            await this.usersService.update(user.id, {
                displayName: userInfo.name || user.displayName,
            });
        } else {
            user = await this.usersService.createUser({
                email: userInfo.email,
                displayName: userInfo.name || userInfo.email.split('@')[0],
                provider: AuthProvider.JWT_RS256,
                uid: userInfo.id,
                clientId: userInfo.clientId,
            });
        }

        // 6. DETERMINE REDIRECT TARGET
        let redirectTarget = '/';
        if (room) {
            this.validateConferenceName(room);
            redirectTarget = `/room/${encodeURIComponent(room)}`;
        }

        this.logger.log(`[SSO] Success! User: ${user.email}, Target: ${redirectTarget}`);

        return {
            user,
            redirectTarget,
        };
    }

    /**
     * Valider que l'origin est autorisée (CSRF protection)
     */
    private validateOrigin(referer: string | undefined): void {
        if (!referer) {
            this.logger.warn('[SSO] Missing referer header');
            throw new ForbiddenException('Referer header required');
        }

        const allowedOrigins = this.configService.get<string[]>('sso.allowedOrigins') || [];

        if (allowedOrigins.length === 0) {
            this.logger.error('[SSO] No allowed origins configured');
            throw new ForbiddenException('Server configuration error: no allowed origins');
        }

        const isAllowed = allowedOrigins.some(origin => referer.startsWith(origin));

        if (!isAllowed) {
            this.logger.warn(`[SSO] Invalid origin: ${referer}, allowed: ${allowedOrigins.join(', ')}`);
            throw new ForbiddenException('Invalid origin');
        }

        this.logger.log(`[SSO] Origin validated: ${referer}`);
    }

    /**
     * Valider le JWT RS256 avec la clé publique du Provider
     */
    private async validateTokenRS256(token: string): Promise<any> {
        if (!token) {
            this.logger.warn('[SSO] No token provided');
            throw new BadRequestException('Token is required');
        }

        try {
            const publicKey = await this.getProviderPublicKey();

            if (!publicKey) {
                this.logger.error('[SSO] Provider public key not found');
                throw new BadRequestException('Provider public key not configured');
            }

            const payload = this.jwtService.verify(token, {
                secret: publicKey,
                algorithms: ['RS256'],
            });

            this.logger.log(`[SSO] Token validated successfully`);
            return payload;
        } catch (error) {
            this.logger.error(`[SSO] Token validation failed: ${error.message}`);
            throw new BadRequestException(`Invalid token: ${error.message}`);
        }
    }

    /**
     * Extraire et valider les claims du token
     */
    private extractAndValidateClaims(tokenPayload: any): {
        id: string;
        email: string;
        name: string;
        clientId: string;
    } {
        // Vérifier les claims obligatoires
        if (!tokenPayload.sub || !tokenPayload.email) {
            this.logger.warn(`[SSO] Missing required claims: sub=${tokenPayload.sub}, email=${tokenPayload.email}`);
            throw new BadRequestException('Token missing required claims (sub, email)');
        }

        return {
            id: tokenPayload.sub,
            email: tokenPayload.email,
            name: tokenPayload.name || tokenPayload.preferred_username || '',
            clientId: tokenPayload.aud || 'default',
        };
    }

    /**
     * Valider le format du nom de conférence
     */
    private validateConferenceName(name: string): void {
        const pattern = this.configService.get<string>('CONFERENCE_NAME_PATTERN') || '^[a-z0-9_-]{3,64}$';
        const regex = new RegExp(pattern, 'i');

        if (!regex.test(name)) {
            this.logger.warn(`[SSO] Invalid room name: ${name}`);
            throw new BadRequestException('Invalid room name format');
        }
    }

    /**
     * Obtenir la clé publique du Provider
     * 
     * Options (par ordre de priorité):
     * 1. Variable d'environnement: PROVIDER_JWT_PUBLIC_KEY
     * 2. JWKS URL du Provider
     * 3. Fichier de configuration
     * 
     * Note: Convertit les séquences littérales \n en véritables retours à la ligne
     * (nécessaire car les variables d'env contiennent souvent des \n littérales)
     */
    private async getProviderPublicKey(): Promise<string> {
        // Option 1: Variable d'environnement directe
        const envKey = this.configService.get<string>('sso.providerPublicKey');
        if (envKey) {
            // Convert literal \n sequences to actual newlines
            return envKey.replaceAll('\\n', '\n');
        }

        // Option 2: URL du JWKS endpoint (implémentation future)
        const jwksUrl = this.configService.get<string>('sso.providerJwksUrl');
        if (jwksUrl) {
            this.logger.warn('[SSO] JWKS endpoint support not yet implemented. Use PROVIDER_JWT_PUBLIC_KEY env var.');
        }

        // Option 3: Fichier de clé (implémentation future)
        const keyFile = this.configService.get<string>('sso.providerPublicKeyFile');
        if (keyFile) {
            this.logger.warn('[SSO] Key file support not yet implemented. Use PROVIDER_JWT_PUBLIC_KEY env var.');
        }

        throw new Error('Provider public key not configured');
    }
}
