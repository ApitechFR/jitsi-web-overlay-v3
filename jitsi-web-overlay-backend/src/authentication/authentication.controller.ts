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
  @Get('userinfo')
  @ApiOkResponse({ description: 'Retourne les infos utilisateur du JWT' })
  @ApiUnauthorizedResponse({ description: 'Utilisateur non authentifié' })
  userinfo(@Req() request: Request) {
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
    @Query('state') stateFromFrontend?: string,
  ) {
    const state = stateFromFrontend || crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    this.authenticationService.setAuthCookie(response, 'state', state);

    if (room) {
      this.authenticationService.setAuthCookie(response, 'roomName', room);
    }

    return { url: this.authenticationService.loginAuthorize(state, nonce) };
  }
  @Get('login_callback')
  @ApiResponse({ status: 302, description: 'Pose les cookies puis redirige vers le front' })
  @ApiUnauthorizedResponse({ description: "state invalide ou absent" })
  @ApiNotFoundResponse({ description: "erreur lors de l’échange code→tokens ou userinfo" })
  async loginCallback(
    @Query() query: LoginCallbackDTO,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const { code, state } = query;

    // Garde: paramètres manquants → retour front
    if (!code || !state) {
      return response.redirect(302, this.getFrontRedirectTarget(request));
    }

    // Double hit: déjà loggé → redirige
    if (request.signedCookies?.accessToken) {
      return response.redirect(302, this.getFrontRedirectTarget(request));
    }

    const sendedState = request.signedCookies?.state;
    const roomName = request.signedCookies?.roomName;

    const { userinfo, idToken } =
      await this.authenticationService.loginCallback(code, state, sendedState);



    const userInfos = this.authenticationService.extractUserInfos(userinfo);

    const baseClaims = {
      iss: this.configService.get('JITSI_JITSIJWT_ISS'),
      aud: this.configService.get('JITSI_JITSIJWT_AUD'),
      sub: this.configService.get('JITSI_JITSIJWT_SUB'),
      email: this.authenticationService.extractEmail(userinfo),
      ...userInfos,
    };


    const accessToken = this.authenticationService.generateAccessToken(baseClaims);
    const refreshToken = this.authenticationService.generateRefreshToken({
      ...baseClaims,
      idToken,
    });


    // Pose les cookies de session
    this.authenticationService.setAuthCookie(response, 'refreshToken', refreshToken);
    this.authenticationService.setAuthCookie(response, 'accessToken', accessToken);

    // Nettoyage ciblé des cookies temporaires
    this.authenticationService.clearAuthCookie(response, 'state');
    this.authenticationService.clearAuthCookie(response, 'roomName');

    // Redirection finale (home ou /:roomName)
    return response.redirect(302, this.getFrontRedirectTarget(request, roomName));
  }



  @Get('logout')
  @Redirect('', 302)
  @ApiResponse({ status: 302, description: 'redirection vers cerbère' })
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const decoded = request?.signedCookies?.refreshToken
      ? this.jwtService.decode(request.signedCookies.refreshToken)
      : undefined;

    const idToken = decoded?.idToken;
    const state = crypto.randomBytes(32).toString('hex');

    this.authenticationService.setAuthCookie(response, 'state', state);

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
    const sendedState = request?.signedCookies?.state;
    const { state } = query;

    if (state !== sendedState) {
      throw new UnauthorizedException(
        "Le state de retour n'est pas le même que celui envoyé",
      );
    }

    this.authenticationService.clearAllCookies(response);

    return response.redirect(this.configService.get('FRONTEND_LOGOUT_REDIRECT') || '/');
  }


  @Get('refreshToken')
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
      };

      const accessToken = this.authenticationService.generateAccessToken(baseClaims);


      const newRefreshToken = this.authenticationService.generateRefreshToken({
        ...baseClaims,
        idToken: decoded?.idToken,
      });

      this.authenticationService.setAuthCookie(response, 'refreshToken', newRefreshToken);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Veuillez vous authentifier');
    }
  }
}
