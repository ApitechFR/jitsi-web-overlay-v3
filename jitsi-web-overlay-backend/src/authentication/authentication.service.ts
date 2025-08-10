import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  Logger,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as queryString from 'querystring';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AuthCookieUtil } from './utils/auth-cookie.util';

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);
  private readonly cookieUtil: AuthCookieUtil;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.cookieUtil = new AuthCookieUtil(this.configService);
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

      return { idToken, userinfo };
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

  generateJwtPair(claims: Record<string, any>) {
    const secret = this.configService.get('JWT_SECRET');

    const refreshToken = this.jwtService.sign(claims, {
      expiresIn: '12h',
      algorithm: 'HS256',
      secret,
    });
    const accessToken = this.jwtService.sign(claims, {
      expiresIn: '15m',
      algorithm: 'HS256',
      secret,
    });
    return { refreshToken, accessToken };
  }

  generateAccessToken(claims: Record<string, any>) {
    const secret = this.configService.get('JWT_SECRET');
    return this.jwtService.sign(claims, {
      expiresIn: '15m',
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


  setAuthCookie(response: Response, name: string, value: string) {
    this.cookieUtil.setAuthCookie(response, name, value);
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

      // adapte les noms de rôles à ton Keycloak
      return roles.includes('admin') || roles.includes('apitech-admin');
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
}
