import { ConfigService } from '@nestjs/config';
import { AuthenticationService } from './authentication.service';
import {
  Controller,
  Get,
  Query,
  Redirect,
  Res,
  Req,
  Headers,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthProvider } from '../users/entities/users.entity';
import { Request, Response } from 'express';
import * as crypto from 'node:crypto';

import { JwtService } from '@nestjs/jwt';
import { LoginCallbackDTO } from './DTOs/LoginCallbackDTO';
import { LogoutCallbackDTO } from './DTOs/LogoutCallbackDTO';
import {
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { IConferenceService } from '../conference/interfaces/conference-service.interface';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TenantContext } from '../common/context/tenant.context';
import { ClientDomainRepository } from '../reseller/repositories/client-domain.repository';
import { v4 as uuidv4 } from 'uuid';

@Controller()
export class AuthenticationController {

  constructor(
    private readonly authenticationService: AuthenticationService,
    @Inject(IConferenceService)
    private readonly conferenceService: IConferenceService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tenantContext: TenantContext,
    private readonly clientDomainRepository: ClientDomainRepository,
  ) { }

  private getFrontBaseUrl(): string {
    return (
      this.configService.get('FRONTEND_BASE_URL') ||
      this.configService.get('FRONTEND_LOGOUT_REDIRECT') ||
      '/'
    );
  }

  private getFrontRedirectTarget(req: Request, roomName?: string): string {
    const base = this.getFrontBaseUrl().replace(/\/+$/, '');
    const room = roomName ?? (req as any).signedCookies?.roomName;
    return room ? `${base}/${encodeURIComponent(room)}` : base;
  }

  /**
    * Return user information from the JWT.
    */
  @Get('authentication/userinfo')
  @ApiOkResponse({ description: 'Retourne les infos utilisateur du JWT + synchronisées avec la base' })
  @ApiUnauthorizedResponse({ description: 'Utilisateur non authentifié' })
  async userinfo(@Req() request: Request) {
    const accessToken = request.signedCookies?.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    try {
      const decoded = this.jwtService.verify(accessToken, {
        secret: this.configService.get('JWT_SECRET'),
        algorithms: ['HS256'],
      });
      if (!decoded) {
        throw new UnauthorizedException('JWT invalide');
      }
      return decoded;
    } catch {
      throw new UnauthorizedException('JWT invalide');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('authentication/whereami')
  @ApiOkResponse({ description: "retoune 'RIE' ou 'INTERNET' " })
  whereami(@Headers('webconf-user-region') userAgent: string) {
    return userAgent;
  }

  @Get('authentication/login_authorize')
  @Redirect('', 302)
  @ApiOkResponse({
    description: "retourne l'url de redirection",
  })
  loginAuthorize(
    @Res({ passthrough: true }) response: Response,
    @Query('room') room: string,
    @Query('state') stateFromFrontend?: string,
    @Query('sessionOnly') sessionOnly?: string,
  ) {
    const state = stateFromFrontend || crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    this.authenticationService.setAuthCookie(response, 'state', state);
    if (room) {
      this.authenticationService.setAuthCookie(response, 'roomName', room);
    }
    // Set a temporary cookie for sessionOnly mode (read at callback) 
    if (sessionOnly === '1') {
      this.authenticationService.setAuthCookie(response, 'sessionOnly', '1');
    } else {
      this.authenticationService.clearAuthCookie(response, 'sessionOnly');
    }
    return { url: this.authenticationService.loginAuthorize(state, nonce) };
  }
  @Get('authentication/login_callback')
  @ApiResponse({ status: 302, description: 'Pose les cookies puis redirige vers le front' })
  @ApiUnauthorizedResponse({ description: "state invalide ou absent" })
  @ApiNotFoundResponse({ description: "erreur lors de l’échange code→tokens ou userinfo" })
  async loginCallback(
    @Query() query: LoginCallbackDTO,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const { code, state } = query;

    // Guard: missing parameters → redirect to frontend
    if (!code || !state) {
      return response.redirect(302, this.getFrontRedirectTarget(request));
    }

    const existing = request.signedCookies?.accessToken;
    if (existing) {
      try {
        this.jwtService.verify(existing, {
          secret: this.configService.get('JWT_SECRET'),
          algorithms: ['HS256'],
        });
        // Token still valid → already logged in
        return response.redirect(302, this.getFrontRedirectTarget(request));
      } catch {

      }
    }


    const sendedState = request.signedCookies?.state;
    const roomName = request.signedCookies?.roomName;


    const { userinfo, idToken } =
      await this.authenticationService.loginCallback(code, state, sendedState);

    // Create or update the OIDC user in the database
    const user = await this.authenticationService.upsertOidcUser(userinfo);

    // Always use the admin value from the database
    const userInfos = this.authenticationService.extractUserInfos(userinfo);

    const baseClaims = {
      iss: this.configService.get('JITSI_JITSIJWT_ISS'),
      aud: this.configService.get('JITSI_JITSIJWT_AUD'),
      sub: this.configService.get('JITSI_JITSIJWT_SUB'),
      email: this.authenticationService.extractEmail(userinfo),
      ...userInfos,
      admin: user.admin, // Override admin from DB
      role: user.role,   // Add role from DB
      uid: user.uid,
    };

    const accessToken = this.authenticationService.generateAccessToken(baseClaims);
    const refreshToken = this.authenticationService.generateRefreshToken({
      ...baseClaims,
      idToken,
    });

    // Read sessionOnly preference from temporary cookie or env variable 
    let sessionOnly: boolean;
    if (request.signedCookies?.sessionOnly !== undefined) {
      sessionOnly = request.signedCookies.sessionOnly === '1';
    } else {
      // If the frontend does not specify, check the environment variable SESSION_PERSISTENCE
      // true => persistent session, false => sessionOnly
      const envPersist = this.configService.get<string>('SESSION_PERSISTENCE');
      sessionOnly = envPersist === 'false' || envPersist === '0';
    }

    // Set session cookies
    if (sessionOnly) {
      // Session cookie: no maxAge/Expires
      this.authenticationService.setAuthCookie(response, 'accessToken', accessToken);
      this.authenticationService.setAuthCookie(response, 'refreshToken', refreshToken);
      this.authenticationService.clearAuthCookie(response, 'sessionOnly');
    } else {
      // Persistent cookie (default)
      this.authenticationService.setAuthCookie(response, 'accessToken', accessToken, {
        maxAge: 2 * 60 * 60 * 1000, // 2h
      });
      this.authenticationService.setAuthCookie(response, 'refreshToken', refreshToken, {
        maxAge: 12 * 60 * 60 * 1000, // 12h
      });
    }

    // Targeted cleanup of temporary cookies
    this.authenticationService.clearAuthCookie(response, 'state');
    this.authenticationService.clearAuthCookie(response, 'roomName');

    // Final redirection (home or /:roomName)
    return response.redirect(302, this.getFrontRedirectTarget(request, roomName));
  }



  @Get('authentication/logout')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Logout successful (JWT RS256) or redirect (OIDC)' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Check reseller mode (JWT RS256)
    const isResellerModeEnabled = this.configService.get<boolean>('RESELLER_MODE_ENABLED', false);

    if (isResellerModeEnabled) {
      // Mode JWT RS256 (Multi-Tenant/Reseller)
      // Clear session cookies and return success
      // Frontend will handle the redirect to home
      this.authenticationService.clearAllCookies(response);
      return { success: true, message: 'Logged out successfully' };
    }

    // Mode OIDC original (Single-Tenant)
    // Permettre le logout via sendBeacon (Content-Type text/plain)
    if (request.headers['content-type'] === 'text/plain') {
      this.authenticationService.clearAllCookies(response);
      return '';
    }
    const decoded = request?.signedCookies?.refreshToken
      ? this.jwtService.decode(request.signedCookies.refreshToken)
      : undefined;

    const idToken = decoded?.idToken;
    const state = crypto.randomBytes(32).toString('hex');

    this.authenticationService.setAuthCookie(response, 'state', state);

    // Redirect to OIDC logout URL
    const logoutUrl = this.authenticationService.logout(state, idToken);
    response.redirect(logoutUrl);
  }

  /**
   * Specific logout flow for JWT RS256 multi-tenant mode:
   * @private
   */
  private logoutJwtRs256() {
    // Try to get clientId from tenantContext (if JWT Bearer token is present)
    const clientId = this.tenantContext.getClientId();

    // If clientId is present, perform full logout via clientId
    if (clientId) {
      return this.authenticationService.logoutJwtRs256(clientId);
    }

    // Fallback: User might be authenticated via cookies only (no Bearer token)
    // In this case, just return success (cookies will be cleared by clearAllCookies below)
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('authentication/logout_callback')
  @ApiOkResponse({ description: "returns the url /" })
  @ApiUnauthorizedResponse({
    description:
      "the returned state is not the same as the one that was sent",
  })
  logoutCallback(
    @Query() query: LogoutCallbackDTO,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sendedState = request?.signedCookies?.state;
    const { state } = query;

    if (state !== sendedState) {
      throw new UnauthorizedException(
        "The returned state is not the same as the one that was sent",
      );
    }

    this.authenticationService.clearAllCookies(response);

    return response.redirect(this.configService.get('FRONTEND_LOGOUT_REDIRECT') || '/');
  }

  @Get('/auth/logout')
  logoutCallbackAlias(
    @Query() query: LogoutCallbackDTO,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Call the existing method
    return this.logoutCallback(query, request, response);
  }


  @Get('authentication/refreshToken')
  @ApiOkResponse({ description: 'retourne { accessToken }' })
  @ApiUnauthorizedResponse({ description: 'veuillez vous authentifier' })
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.signedCookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Veuillez vous authentifier');
    }

    try {

      await this.jwtService.verify(refreshToken, { secret: this.configService.get('JWT_SECRET'), algorithms: ['HS256'] });

      const decoded = this.jwtService.decode(refreshToken);

      const baseClaims = {
        iss: this.configService.get('JITSI_JITSIJWT_ISS'),
        aud: this.configService.get('JITSI_JITSIJWT_AUD'),
        sub: this.configService.get('JITSI_JITSIJWT_SUB'),
        email: decoded?.email,
        given_name: decoded?.given_name || '',
        family_name: decoded?.family_name || '',
        name: decoded?.name || '',
        isAdmin: Boolean(decoded?.admin),
        uid: decoded?.uid,
      };

      const accessToken = this.authenticationService.generateAccessToken(baseClaims);


      const newRefreshToken = this.authenticationService.generateRefreshToken({
        ...baseClaims,
        idToken: decoded?.idToken,
      });


      this.authenticationService.setAuthCookie(response, 'accessToken', accessToken, {
        maxAge: 2 * 60 * 60 * 1000, // 2h
      });
      this.authenticationService.setAuthCookie(response, 'refreshToken', newRefreshToken, {
        maxAge: 12 * 60 * 60 * 1000, // 12h
      });

      return { accessToken };
    } catch (error) {
      this.authenticationService.clearAllCookies(response);

      throw error instanceof UnauthorizedException ? error : new UnauthorizedException('Veuillez vous authentifier');
    }
  }

  /**
   * Reseller mode: Accept JWT RS256 Bearer token and create session
   * POST /authentication/reseller/login
   * Authorization: Bearer <jwt_rs256_token>
   */
  @Post('authentication/reseller/login')
  @ApiResponse({ status: 200, description: 'JWT valide, session créée (cookies configurés)' })
  @ApiResponse({ status: 401, description: 'JWT invalide ou expiré' })
  @ApiResponse({ status: 403, description: 'Mode reseller désactivé' })
  async resellerLogin(
    @Headers('authorization') authHeader: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Check if reseller mode is enabled
    const resellerModeEnabled = this.configService.get<boolean>('RESELLER_MODE_ENABLED', false);
    if (!resellerModeEnabled) {
      throw new ForbiddenException('Reseller mode is not enabled');
    }

    // Extract Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7);

    // Get RS256 public key
    const publicKeyRaw = this.configService.get<string>('PROVIDER_JWT_PUBLIC_KEY');
    if (!publicKeyRaw) {
      throw new UnauthorizedException('RS256 public key not configured');
    }

    // Convert literal \n to actual newlines
    const publicKey = publicKeyRaw.replace(/\\n/g, '\n');

    // Validate JWT RS256
    let decoded: any;
    try {
      decoded = this.jwtService.verify(token, {
        secret: publicKey,
        algorithms: ['RS256'],
        issuer: 'MjWRmjB7zE2gdXznagfT7vsmTx3Cn3Zw',
        audience: 'jitsi',
      });
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      throw new UnauthorizedException(`Invalid JWT RS256: ${err}`);
    }

    if (!decoded) {
      throw new UnauthorizedException('JWT verification returned invalid payload');
    }

    // Extract user info from JWT
    const email = decoded.email || decoded.sub;
    if (!email) {
      throw new UnauthorizedException('JWT must contain email or sub claim');
    }

    // Extract client info from JWT (for multi-tenant isolation)
    let clientId = decoded.clientId || decoded.client_id;
    const offerType = decoded.offerType || decoded.offer_type;

    // If clientId not in JWT, try to resolve from email domain
    if (!clientId && email?.includes('@')) {
      const emailDomain = email.split('@')[1];
      const clientDomain = await this.clientDomainRepository.findByDomainName(emailDomain);
      if (clientDomain) {
        clientId = String(clientDomain.client.id);
      }
    }

    // Ensure we have a clientId to proceed in reseller mode
    if (!clientId) {
      throw new UnauthorizedException(
        'Cannot resolve clientId from JWT or email domain. Ensure the JWT contains clientId or the email domain is registered.',
      );
    }

    // console.log('clientId JWT login:', clientId);
    // this.tenantContext.setClientId(clientId);
    // Create/upsert user
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      // Create new user for reseller flow
      user = await this.usersService.createUser({
        email,
        displayName: decoded.name || email.split('@')[0],
        provider: AuthProvider.JWT_RS256,
        // uid: crypto.randomBytes(16).toString('hex'),
        uid: uuidv4(),
        clientId, // Store clientId for multi-tenant isolation
      });
      if (!user) {
        throw new UnauthorizedException('Failed to create user');
      }
    } else if (clientId && !user.clientId) {
      // User exists but has no clientId - assign it now (for reseller migration scenarios)
      user = await this.usersService.update(user.id, { clientId });
    }

    // Generate session tokens (same as OIDC)
    const baseClaims = {
      iss: this.configService.get('JITSI_JITSIJWT_ISS'),
      aud: this.configService.get('JITSI_JITSIJWT_AUD'),
      sub: this.configService.get('JITSI_JITSIJWT_SUB'),
      email,
      name: decoded.name || email,
      uid: user.uid,
      ...(clientId && { clientId }), // Include clientId if present (for multi-tenant isolation)
      ...(offerType && { offerType }), // Include offerType if present (for plan/feature access)
    };

    const accessToken = this.authenticationService.generateAccessToken(baseClaims);
    const refreshToken = this.authenticationService.generateRefreshToken({
      ...baseClaims,
      idToken: token, // Store original JWT as idToken for reference
    });

    // Set session cookies (same as OIDC)
    this.authenticationService.setAuthCookie(response, 'accessToken', accessToken, {
      maxAge: 2 * 60 * 60 * 1000, // 2h
    });
    this.authenticationService.setAuthCookie(response, 'refreshToken', refreshToken, {
      maxAge: 12 * 60 * 60 * 1000, // 12h
    });

    return { authenticated: true, email };
  }
}
