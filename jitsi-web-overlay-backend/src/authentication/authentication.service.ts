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

  loginAuthorize(state: string, nonce: string) {
    return `${this.configService.get('AGENTCONNECT_URL')}/api/v2/authorize?response_type=code&acr_values=eidas1&scope=${this.configService.get('AGENTCONNECT_SCOPE')}&client_id=${this.configService.get('AGENTCONNECT_CLIENTID')}&redirect_uri=${this.configService.get('AGENTCONNECT_REDIRECT_URL')}/login_callback&state=${state}&nonce=${nonce}`;
  }

  async loginCallback(code: string, state: string, sendedState: string) {
    const client_id = this.configService.get('AGENTCONNECT_CLIENTID');
    const client_secret = this.configService.get('AGENTCONNECT_SECRET');
    const redirect_uri =
      this.configService.get('AGENTCONNECT_REDIRECT_URL') + '/login_callback';

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
        `${this.configService.get('AGENTCONNECT_URL')}/api/v2/token`,
        queryString.stringify({
          grant_type: 'authorization_code',
          code,
          client_id,
          client_secret,
          redirect_uri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          proxy: false,
          httpsAgent: new HttpsProxyAgent(
            this.configService.get('AGENTCONNECT_PROXYURL'),
          ),
        },
      );
      this.logger.log(
        "accessToken récupéré d'agentConnect {/authentication/login_callback} route",
      );

      const { data: userinfo } = await this.httpService.axiosRef.get(
        `${this.configService.get('AGENTCONNECT_URL')}/api/v2/userinfo`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          proxy: false,
          httpsAgent: new HttpsProxyAgent(
            this.configService.get('AGENTCONNECT_PROXYURL'),
          ),
        },
      );
      this.logger.log(
        "userinfo récupéré d'agentConnect {/authentication/login_callback} route",
      );

      return { idToken, userinfo };
    } catch (error) {
      this.logger.error(
        "erreur lors de récupération de l'accessToken ou userinfo d'agentConnect",
        error,
      );
      throw new NotFoundException(
        "erreur lors de récupération de l'accessToken ou userinfo d'agentConnect",
      );
    }
  }

  logout(state, idToken) {
    this.logger.log('{/authentication/logout} route');
    const query = {
      id_token_hint: idToken,
      state,
      post_logout_redirect_uri:
        this.configService.get('AGENTCONNECT_REDIRECT_URL') +
        '/logout_callback',
    };
    const url =
      this.configService.get('AGENTCONNECT_URL') + '/api/v2/session/end' + '?';
    return url + queryString.stringify(query);
  }
}
