import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  Logger,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import * as queryString from 'querystring';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AuthCookieUtil } from './utils/auth-cookie.util';
import { UsersService } from '../users/users.service';
import { User, AuthProvider } from '../users/entities/users.entity';
import { v4 as uuidv4 } from 'uuid';
import { TenantContext } from '../common/context/tenant.context';

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);
  private readonly cookieUtil: AuthCookieUtil;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly tenantContext: TenantContext,
  ) {
    this.cookieUtil = new AuthCookieUtil(this.configService);
  }

  /**
  * Returns true if the user is admin according to OIDC info or the database value.
  * @param userinfo OIDC userinfo object
  * @param existingAdmin Optional: current admin value from DB
  */
  private isAdmin(userinfo: any, existingAdmin?: boolean): boolean {
    // TRUE always wins: if either OIDC or DB is true, return true
    let oidcAdmin: boolean | undefined = undefined;
    if (typeof userinfo?.admin === 'boolean') {
      oidcAdmin = userinfo.admin;
    } else if (typeof userinfo?.admin === 'string') {
      oidcAdmin = userinfo.admin === 'true';
    } else if (
      Array.isArray(userinfo?.realm_access?.roles) ||
      Array.isArray(userinfo?.resource_access?.account?.roles)
    ) {
      const roles = [
        ...(userinfo?.realm_access?.roles ?? []),
        ...(userinfo?.resource_access?.account?.roles ?? [])
      ].map((r: any) => String(r).toLowerCase());
      oidcAdmin = roles.includes('admin');
    }
    // If either is true, return true
    return Boolean(oidcAdmin) || Boolean(existingAdmin);
  }


  /**
   * Crée ou met à jour un utilisateur OIDC dans la base users
   */
  // async upsertOidcUser(userinfo: any): Promise<User> {

  //   const normalized = this.extractUserInfos(userinfo);

  //   if (!normalized.email) {
  //     this.logger.warn("Userinfo object is missing 'email' property", { userinfo });
  //     throw new UnauthorizedException("Invalid userinfo: missing 'email' property");
  //   }
  //   const existing = await this.usersService.findByEmail(normalized.email);

  //   // Récupère le rôle depuis OIDC si présent
  //   let oidcRole: string | null = null;
  //   if (userinfo?.realm_access?.roles?.length) {
  //     oidcRole = userinfo.realm_access.roles[0];
  //   } else if (userinfo?.resource_access?.account?.roles?.length) {
  //     oidcRole = userinfo.resource_access.account.roles[0];
  //   } else if (userinfo?.role) {
  //     oidcRole = userinfo.role;
  //   }


  //   const userData: Partial<User> = {
  //     email: userinfo.email,
  //     username: userinfo.preferred_username || userinfo.name || userinfo.email,
  //     displayName: userinfo.name || userinfo.preferred_username || userinfo.email,
  //     provider: AuthProvider.OIDC,
  //     externalId: userinfo.sub || userinfo.external_id || null,
  //     avatarUrl: userinfo.picture || null,
  //     isActive: true,
  //     role: oidcRole || undefined,
  //     // admin is true if either OIDC or the database value is true
  //     admin: this.isAdmin(userinfo, typeof existing?.admin === 'boolean' ? existing.admin : false),
  //   };

  //   if (!existing) {
  //     userData.uid = uuidv4();
  //     return this.usersService.createUser(userData);
  //   } else {
  //     if (!existing.uid) {
  //       userData.uid = uuidv4();
  //     }
  //     // Update if OIDC or admin value has changed compared to the database
  //     let changed = false;
  //     for (const key of Object.keys(userData)) {
  //       if (userData[key] !== undefined && existing[key] !== userData[key]) changed = true;
  //     }
  //     // If OIDC does not provide a role, keep the one from the database
  //     if (!oidcRole && existing.role) {
  //       userData.role = existing.role;
  //     }
  //     // admin is true if OIDC OR the database value is true (see calculation above)
  //     if (changed) {
  //       return this.usersService.update(existing.id, { ...userData });
  //     }
  //     return existing;
  //   }
  // }
  async upsertOidcUser(userinfo: any): Promise<User> {
    const normalized = this.extractUserInfos(userinfo);

    if (!normalized.email) {
      this.logger.warn("Userinfo object is missing 'email' property", { userinfo });
      throw new UnauthorizedException("Invalid userinfo: missing 'email' property");
    }

    const existing = await this.usersService.findByEmail(normalized.email);

    let oidcRole: string | null = null;
    if (userinfo?.realm_access?.roles?.length) {
      oidcRole = userinfo.realm_access.roles[0];
    } else if (userinfo?.resource_access?.account?.roles?.length) {
      oidcRole = userinfo.resource_access.account.roles[0];
    } else if (userinfo?.role) {
      oidcRole = userinfo.role;
    }

    const userData: Partial<User> = {
      email: normalized.email,
      username:
        normalized.preferred_username ||
        normalized.name ||
        normalized.email,
      displayName:
        normalized.name ||
        normalized.preferred_username ||
        normalized.email,
      provider: AuthProvider.OIDC,
      externalId: normalized.sub || userinfo.sub || userinfo.external_id || null,
      avatarUrl: userinfo.picture || null,
      isActive: true,
      role: oidcRole || undefined,
      admin: this.isAdmin(userinfo, typeof existing?.admin === 'boolean' ? existing.admin : false),
    };

    if (!existing) {
      userData.uid = uuidv4();
      return this.usersService.createUser(userData);
    } else {
      if (!existing.uid) {
        userData.uid = uuidv4();
      }

      if (!oidcRole && existing.role) {
        userData.role = existing.role;
      }

      let changed = false;
      for (const key of Object.keys(userData)) {
        if (userData[key] !== undefined && existing[key] !== userData[key]) {
          changed = true;
        }
      }

      if (changed) {
        return this.usersService.update(existing.id, { ...userData });
      }

      return existing;
    }
  }

  loginAuthorize(
    state: string,
    nonce: string,
    provider: 'oidc' | 'agentconnect' = 'oidc',
  ) {
    const redirectUri =
      provider === 'agentconnect'
        ? this.configService.get('AGENTCONNECT_REDIRECT_URL')
        : this.configService.get('OIDC_REDIRECT_URL');

    //return `${this.configService.get('AUTHORIZATION_ENDPOINT')}/?response_type=code&acr_values=eidas1&scope=${this.configService.get('OIDC_SCOPE')}&client_id=${this.configService.get('OIDC_CLIENTID')}&redirect_uri=${redirectUri}&state=${state}&nonce=${nonce}`;
    const authz = (this.configService.get('AUTHORIZATION_ENDPOINT') || '').replace(/\/+$/, '');
    const scope = this.configService.get('OIDC_SCOPE');
    const clientId = this.configService.get('OIDC_CLIENTID');
    return `${authz}?response_type=code&acr_values=eidas1&scope=${scope}&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&nonce=${nonce}`;

  }

  async loginCallback(
    code: string,
    state: string,
    sendedState: string,
    provider: 'oidc' | 'agentconnect' = 'oidc',
  ) {
    if (sendedState !== state) {
      this.logger.warn("Le state reçu ne correspond pas à celui envoyé.");
      throw new UnauthorizedException("Le paramètre state est invalide");
    }

    const client_id = this.configService.get('OIDC_CLIENTID');
    const client_secret = this.configService.get('OIDC_SECRET');
    const redirect_uri =
      provider === 'agentconnect'
        ? this.configService.get('AGENTCONNECT_REDIRECT_URL')
        : this.configService.get('OIDC_REDIRECT_URL');

    try {
      const tokenBody: any = {
        grant_type: 'authorization_code',
        code,
        client_id,
        redirect_uri,
      };
      if (client_secret) tokenBody.client_secret = client_secret;
      const {
        data: { access_token: accessToken, id_token: idToken },
      } = await this.httpService.axiosRef.post(
        this.configService.get('TOKEN_ENDPOINT'),
        queryString.stringify(tokenBody),
        provider === 'agentconnect'
          ? {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            proxy: false,
            httpsAgent: new HttpsProxyAgent(
              this.configService.get('AGENTCONNECT_PROXYURL'),
            ),
          }
          : {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
      );

      const { data: userinfo } = await this.httpService.axiosRef.get(
        this.configService.get('USERINFO_ENDPOINT'),
        provider === 'agentconnect'
          ? {
            headers: { Authorization: `Bearer ${accessToken}` },
            proxy: false,
            httpsAgent: new HttpsProxyAgent(
              this.configService.get('AGENTCONNECT_PROXYURL'),
            ),
          }
          : {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
      );

      // merge claims from id_token and userinfo, with precedence to userinfo
      const decodeIdToken = (this.jwtService.decode(idToken) as Record<string, any>) || {};
      const mergedUserInfo = { ...decodeIdToken, ...userinfo };

      return { idToken, userinfo: mergedUserInfo };
    } catch (error) {
      this.logger.error("Erreur dans loginCallback", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });

      throw new NotFoundException(
        `Erreur lors de la récupération de l'accessToken ou userinfo : ${error?.message}`,
      );
    }
  }

  logout(state: string, idToken: string, provider: 'oidc' | 'agentconnect' = 'oidc') {
    this.logger.log('{/authentication/logout} route');
    const redirectUri =
      provider === 'agentconnect'
        ? this.configService.get('AGENTCONNECT_REDIRECT_URL')
        : this.configService.get('OIDC_LOGOUT_REDIRECT_URL') ||
        this.configService.get('OIDC_REDIRECT_URL');

    const query = {
      id_token_hint: idToken,
      state,
      post_logout_redirect_uri: redirectUri,
    };

    const url = this.configService.get('OIDC_END_SESSION_ENDPOINT') + '?';
    return url + queryString.stringify(query);
  }

  /**
   * Logout pour mode JWT RS256 (Multi-Tenant/Reseller)
   * En mode stateless JWT, il y a pas de session serveur à détruire
   * Le logout consiste simplement à nettoyer le contexte client
   * 
   * @param clientId UUID du client à déconnecter
   * @returns Objet de confirmation avec succès et message
   */
  logoutJwtRs256(clientId: string): { success: boolean; message: string; clientId: string } {
    this.logger.log(`JWT RS256 logout for clientId: ${clientId}`);

    // Nettoyage du contexte (TenantContext REQUEST-scoped)
    this.tenantContext.clear();

    return {
      success: true,
      message: 'Session cleared successfully. Token will expire at natural expiration time.',
      clientId,
    };
  }

  generateJwtPair(claims: Record<string, any>) {
    const secret = this.configService.get('JWT_SECRET');

    const refreshToken = this.jwtService.sign(claims, {
      expiresIn: '12h',
      algorithm: 'HS256',
      secret,
    });
    const accessToken = this.jwtService.sign(claims, {
      expiresIn: '2h',
      algorithm: 'HS256',
      secret,
    });
    return { refreshToken, accessToken };
  }

  generateAccessToken(claims: Record<string, any>) {
    const secret = this.configService.get('JWT_SECRET');
    return this.jwtService.sign(claims, {
      expiresIn: '2h',
      algorithm: 'HS256',
      secret,
    });
  }

  generateRefreshToken(claims: Record<string, any>) {
    const secret = this.configService.get('JWT_SECRET');
    return this.jwtService.sign(claims, {
      expiresIn: '12h',
      algorithm: 'HS256',
      secret,
    });
  }


  // setAuthCookie(response: Response, name: string, value: string) {
  //   this.cookieUtil.setAuthCookie(response, name, value);
  // }
  setAuthCookie(response: Response, name: string, value: string, opts?: Record<string, any>) {
    response.cookie(name, value, { ...this.cookieUtil.getCookieOptions(), ...(opts || {}) });
  }

  clearAllCookies(response: Response) {
    this.cookieUtil.clearAllAuthCookies(response);
  }

  extractEmail(userinfo: any): string | undefined {
    if (!userinfo) return undefined;
    if (typeof userinfo === 'string') {
      const decoded = this.jwtService.decode(userinfo);
      return typeof decoded === 'object' ? decoded?.email : undefined;
    }
    return userinfo?.email;
  }

  getCookieOptions() {
    return this.cookieUtil.getCookieOptions();
  }

  clearAuthCookie(response: Response, name: string) {
    this.cookieUtil.clearAuthCookie(response, name);
  }

  isAdminFromUserinfo(userinfo: any): boolean {
    try {
      const roles: string[] = [
        ...(userinfo?.realm_access?.roles ?? []),
        ...(userinfo?.resource_access?.account?.roles ?? []),
      ].map((r: any) => String(r).toLowerCase());


      return roles.includes('admin') || roles.includes('role');
    } catch {
      return false;
    }
  }

  extractNames(userinfo: any) {
    return {
      given_name: userinfo?.given_name || userinfo?.firstName || userinfo?.prenom || '',
      family_name: userinfo?.family_name || userinfo?.lastName || userinfo?.nom || '',
      name: userinfo?.name || '',
    };
  }
  extractUserInfos(userinfo: any) {
    const fallbackUsername =
      userinfo?.preferred_username ||
      userinfo?.id ||
      (typeof userinfo?.email === 'string' ? userinfo.email.split('@')[0] : '') ||
      userinfo?.sub ||
      '';
    const fullName = userinfo?.name || fallbackUsername;

    return {
      sub: userinfo?.sub || '',
      email_verified: Boolean(userinfo?.email_verified),
      name: fullName,
      given_name: userinfo?.given_name || userinfo?.firstName || userinfo?.prenom || fullName || '',
      family_name: userinfo?.family_name || userinfo?.lastName || userinfo?.nom || '',
      preferred_username: userinfo?.preferred_username || '',
      email: userinfo?.email || '',
      admin: userinfo?.admin === true || userinfo?.admin === 'true' || false
    };
  }
}
