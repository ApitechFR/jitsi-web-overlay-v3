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

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  loginAuthorize(
    state: string,
    nonce: string,
    provider: 'oidc' | 'agentconnect' = 'oidc',
  ) {
    const redirectUri =
      provider === 'agentconnect'
        ? this.configService.get('AGENTCONNECT_REDIRECT_URL')
        : this.configService.get('OIDC_REDIRECT_URL');
    return `${this.configService.get('AUTHORIZATION_ENDPOINT')}/?response_type=code&acr_values=eidas1&scope=${this.configService.get('OIDC_SCOPE')}&client_id=${this.configService.get('OIDC_CLIENTID')}&redirect_uri=${redirectUri}&state=${state}&nonce=${nonce}`;
  }

  async loginCallback(
    code: string,
    state: string,
    sendedState: string,
    provider: 'oidc' | 'agentconnect' = 'oidc',
  ) {
    const client_id = this.configService.get('OIDC_CLIENTID');
    const client_secret = this.configService.get('OIDC_SECRET');
    const redirect_uri =
      provider === 'agentconnect'
        ? this.configService.get('AGENTCONNECT_REDIRECT_URL')
        : this.configService.get('OIDC_REDIRECT_URL');

    if (sendedState !== state) {
      this.logger.warn(
        "la variable state envoyé n'est pas celle reçue {/authentication/login_callback} route ",
      );
      throw new UnauthorizedException(
        "le paramètre state reçu n'est pas le meme envoyé",
      );
    }

    try {
      const {
        data: { access_token: accessToken, id_token: idToken },
      } = await this.httpService.axiosRef.post(
        `${this.configService.get('TOKEN_ENDPOINT')}`,
        queryString.stringify({
          grant_type: 'authorization_code',
          code,
          client_id,
          client_secret,
          redirect_uri,
        }),
        provider === 'agentconnect'
          ? {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              proxy: false,
              httpsAgent: new HttpsProxyAgent(
                this.configService.get('AGENTCONNECT_PROXYURL'),
              ),
            }
          : {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            },
      );
      this.logger.log(
        "accessToken récupéré d'agentConnect {/authentication/login_callback} route",
      );

      const { data: userinfo } = await this.httpService.axiosRef.get(
        `${this.configService.get('USERINFO_ENDPOINT')}`,
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
      this.logger.log(
        "userinfo récupéré d'agentConnect {/authentication/login_callback} route",
      );

      return { idToken, userinfo };
    } catch (error) {
      this.logger.error(
        "erreur lors de récupération de l'accessToken ou userinfo d'agentConnect",
        {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
          config: error?.config,
        },
      );
      throw new NotFoundException(
        `erreur lors de récupération de l'accessToken ou userinfo d'agentConnect: ${error?.message}`,
      );
    }
  }

  logout(state, idToken, provider: 'oidc' | 'agentconnect' = 'oidc') {
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
    const fullUrl = url + queryString.stringify(query);
    return fullUrl;
  }
}
