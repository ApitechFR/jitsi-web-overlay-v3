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
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';
import { LoginCallbackDTO } from './DTOs/LoginCallbackDTO';
import { LogoutCallbackDTO } from './DTOs/LogoutCallbackDTO';
import {
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { IConferenceService } from '../conference/interfaces/conference-service.interface';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    @Inject(IConferenceService)
    private readonly conferenceService: IConferenceService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get('whereami')
  @ApiOkResponse({ description: "retoune 'RIE' ou 'INTERNET' " })
  whereami(@Headers('webconf-user-region') userAgent: string) {
    return userAgent;
  }

  @Get('login_authorize')
  @Redirect('', 302)
  @ApiOkResponse({
    description: "retourne l'url de redirection",
  })
  loginAuthorize(
    @Res({ passthrough: true }) response: Response,
    @Query('room') room: string,
  ) {
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');
    response.cookie('state', state, {
      httpOnly: true,
      secure: true,
      signed: true,
    });
    response.cookie('roomName', room, {
      httpOnly: true,
      secure: true,
      signed: true,
    });
    return { url: this.authenticationService.loginAuthorize(state, nonce) };
  }

  @Get('login_callback')
  @ApiOkResponse({
    description: 'retourne un objet {roomName, jwt, accessToken}',
  })
  @ApiUnauthorizedResponse({
    description: "le paramètre state recu n'est pas le meme envoyé",
  })
  @ApiNotFoundResponse({
    description:
      "erreur lors de récupération de l'accessToken ou userinfo d'agentConnect",
  })
  async loginCallback(
    @Query() query: LoginCallbackDTO,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { code, state } = query;
    const sendedState = request.signedCookies?.state;
    const roomName = request.signedCookies?.roomName;
    const { userinfo, idToken } =
      await this.authenticationService.loginCallback(code, state, sendedState);

    const tokenClaims = {
      iss: this.configService.get('JITSI_JITSIJWT_ISS'),
      aud: this.configService.get('JITSI_JITSIJWT_AUD'),
      sub: this.configService.get('JITSI_JITSIJWT_SUB'),
      email: this.jwtService.decode(userinfo)?.email,
      idToken,
    };

    const refreshToken = this.jwtService.sign({
      exp: moment().add(12, 'hours').unix(),
      ...tokenClaims,
    });

    const accessToken = this.jwtService.sign({
      exp: moment().add(15, 'minutes').unix(),
      ...tokenClaims,
    });

    response.clearCookie('state');
    response.clearCookie('roomName');

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      signed: true,
    });

    return { ...this.conferenceService.sendToken(roomName), accessToken };
  }

  @Get('logout')
  @Redirect('', 302)
  @ApiResponse({ status: 302, description: 'redirection vers cerbère' })
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!request?.signedCookies) {
      throw new UnauthorizedException('Cookies manquants');
    }
    const { idToken } =
      request.signedCookies.refreshToken &&
      this.jwtService.decode(request.signedCookies.refreshToken);
    const state = crypto.randomBytes(32).toString('hex');
    response.cookie('state', state, {
      httpOnly: true,
      secure: true,
      signed: true,
    });
    return { url: this.authenticationService.logout(state, idToken) };
  }

  @Get('logout_callback')
  @ApiOkResponse({ description: "retourne l'url /" })
  @ApiUnauthorizedResponse({
    description:
      "le state de retour n'est pas la meme que celle qui a été envoyé",
  })
  logoutCallback(
    @Query() query: LogoutCallbackDTO,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!request?.signedCookies) {
      throw new UnauthorizedException('Cookies manquants');
    }
    const sendedState = request.signedCookies.state;
    const { state } = query;

    if (state !== sendedState) {
      throw new UnauthorizedException(
        "le state de retour n'est pas la meme que celle qui a été envoyé",
      );
    }

    response.clearCookie('refreshToken');
    response.clearCookie('state');
    return { url: '/' };
  }

  @Get('refreshToken')
  @ApiOkResponse({ description: 'retourne { accessToken }' })
  @ApiUnauthorizedResponse({ description: 'veuillez vous authentifier' })
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!request?.signedCookies) {
      throw new UnauthorizedException('Cookies manquants');
    }
    let refreshToken = request.signedCookies.refreshToken;
    try {
      await this.jwtService.verify(refreshToken);

      const tokenClaims = {
        iss: this.configService.get('JITSI_JITSIJWT_ISS'),
        aud: this.configService.get('JITSI_JITSIJWT_AUD'),
        sub: this.configService.get('JITSI_JITSIJWT_SUB'),
        email: this.jwtService.decode(refreshToken)?.email,
        idToken: this.jwtService.decode(refreshToken)?.idToken,
      };

      refreshToken = this.jwtService.sign({
        exp: moment().add(12, 'hours').unix(),
        ...tokenClaims,
      });

      const accessToken = this.jwtService.sign({
        exp: moment().add(15, 'minutes').unix(),
        ...tokenClaims,
      });

      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        signed: true,
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('veuillez vous authentifier');
    }
  }
}
