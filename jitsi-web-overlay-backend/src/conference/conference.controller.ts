import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Headers,
  Req,
  Query,
  Header,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { IConferenceService } from './interfaces/conference-service.interface';
import { CreateConferenceDTO, EndConferenceDTO } from './DTOs/conference.dto';
import { ByEmailDTO } from './DTOs/byEmail.dto';
import { JwtDTO } from './DTOs/jwt.dto';
import { RoomNameDto } from './DTOs/room-name.dto';
import { ConferenceFilter } from './enum/conference_filter.enum';
import { ParseConferenceFilterPipe } from './utils/ParseConferenceFilterPipe';
import { ProsodyRuntimeService } from '../prosody/prosody-runtime.service';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';
import { Roles } from '../authentication/roles.decorator';
import { RolesGuard } from '../authentication/roles.guard';

interface AuthenticatedRequest extends Request {
  user?: any;
}

@ApiTags('Conferences')
@Controller('')
export class ConferenceController {
  constructor(
    @Inject(IConferenceService)
    private readonly conferenceService: IConferenceService,
    private readonly prosodyRuntimeService: ProsodyRuntimeService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('conferences')
  @ApiOkResponse({ description: 'Conférence créée avec succès' })
  async create(@Body() dto: CreateConferenceDTO) {
    return this.conferenceService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('conferences')
  @ApiOkResponse({ description: 'Liste des conférences' })
  async findAll() {
    return this.conferenceService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get("conferences/statistics")
  @ApiOkResponse({ description: "Statistiques des conférences" })
  @ApiBadRequestResponse({ description: "Filtre invalide" })
  async getStatistics() {
    return this.conferenceService.getGlobalStatistics();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get("conferences/summary")
  @ApiOkResponse({ description: "Statistiques des conférences" })
  @ApiBadRequestResponse({ description: "Filtre invalide" })
  async getSummary(
    @Query("filter", new ParseConferenceFilterPipe()) filter?: ConferenceFilter,
    @Query("start") start?: Date,
    @Query("end") end?: Date,
  ) {
    return this.conferenceService.getHistoricSummary(filter, start, end);
  }


  @Get('conferences/:uid/duration')
  async getDuration(
    @Param('uid') uid: string): Promise<{ duration: string }> {
    const duration = await this.conferenceService.getDuration(uid);
    return { duration };
  }

  @UseGuards(JwtAuthGuard)
  @Get('conferences/:uid')
  @ApiOkResponse({ description: 'Conférence trouvée' })
  @ApiNotFoundResponse({ description: 'Conférence non trouvée' })
  async findOne(@Param('uid') uid: string) {
    return this.conferenceService.findOne(uid);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('conferences/:id')
  @ApiOkResponse({ description: 'Conférence supprimée' })
  async delete(@Param('id') id: string) {
    return this.conferenceService.delete(id);
  }

  @Put('conferences/:id')
  @ApiOkResponse({ description: 'Conférence mise à jour' })
  async update(
    @Param('id') id: string,
    @Body() body: Partial<CreateConferenceDTO>,
  ) {
    if ('update' in this.conferenceService) {
      return (this.conferenceService as any).update(id, body);
    }
    return { message: 'Mise à jour non supportée pour cette base.' };
  }

  @Get('conferences/:conference_name/name')
  async getConferenceByName(@Param('conference_name') name: string) {
    return await this.conferenceService.findByName(name);
  }

  @Put('conferences/:confName/end')
  async updateEndTime(
    @Param('confName') confName: string,
    @Body() dto: EndConferenceDTO,
  ) {
    return this.conferenceService.updateEndTimeConferenceByName(confName, dto.end_time);
  }

  //TODO : to remove Old name /roomExists/:roomName
  @UseGuards(JwtAuthGuard)
  @Get('/roomExists/:roomName')
  @ApiOkResponse({ description: 'retourne roomName si la conférence existe' })
  @ApiNotFoundResponse({
    description: "retourne 404 si la conférence n'existe pas",
  })
  async roomExists(@Param() params: RoomNameDto) {
    return this.conferenceService.roomExists(params.roomName);
  }

  @Get('/conferences/:roomName/state')
  @ApiOkResponse({ description: 'retourne l\'état de la conférence' })
  @ApiNotFoundResponse({
    description: "retourne 404 si la conférence n'existe pas",
  })
  async getConferenceState(@Param() params: RoomNameDto) {
    return this.conferenceService.roomExists(params.roomName);
  }


  @Get('/conferences/:roomName/room-size')
  async getRoomSize(@Param() params: RoomNameDto) {
    return this.conferenceService.getRoomSize(params.roomName);
  }

  //send token by email
  @Post('conference/create/byemail')
  @ApiOkResponse({
    description: "retourne { isWhitelisted: true, sended: 'email sended' }",
  })
  @ApiOkResponse({
    description: "retourne roomName et jwt si la conférence n'est pas ouverte",
  })
  @ApiBadRequestResponse({
    description: "erreur de l'envoi de l'email",
  })
  @ApiUnauthorizedResponse({
    description:
      "retourne { isWhitelisted: false } si l'émail n'est pas autorisé",
  })
  @ApiBody({ type: ByEmailDTO })
  async getRoomAccessTokenByEmail(
    @Body() body: ByEmailDTO,
    @Headers('host') host: string,
  ) {
    const args = { room: body.roomName, email: body.email, host };
    return this.conferenceService.getRoomAccessTokenByEmail(args);
  }

  // Check JWT token validity
  @UseGuards(JwtAuthGuard)
  @Post('verify-token')
  @ApiOkResponse({ description: 'JWT vérifié avec succès' })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  async verifyToken(@Body() dto: JwtDTO) {
    return this.conferenceService.verifyToken(dto.jwt);
  }

  //TODO update new name :old name /:roomName
  @UseGuards(JwtAuthGuard)
  @Get('conferences/access/:roomName')
  @ApiOkResponse({
    description: 'retourne roomName si la conférence est déja ouverte',
  })
  @ApiOkResponse({
    description: "retourne roomName et jwt si la conférence n'est pas ouverte",
  })
  @ApiNotFoundResponse({
    description: "retourne 404 si la conférence n'existe pas",
  })
  @ApiUnauthorizedResponse({
    description:
      "veuillez vous authentifier pour accéder à la webconf de l'Etat",
  })
  @ApiBody({ type: RoomNameDto })
  @ApiBearerAuth()
  async getRoomAccessToken(
    @Param() params: RoomNameDto,
    @Headers('webconf-user-region') webconfUserRegion: string,
    @Headers('authorization') accessToken: string,
  ) {
    accessToken = accessToken?.split(' ')[1];
    return this.conferenceService.getRoomAccessToken(
      params.roomName,
      webconfUserRegion,
      accessToken,
    );
  }

  // @UseGuards(JwtAuthGuard)
  @Post('conferences/:roomName/tokens/jitsi')
  @Header('Cache-Control', 'no-store')
  async createJitsiToken(
    @Param('roomName') roomName: RoomNameDto['roomName'],
    @Req() req: AuthenticatedRequest,
    @Body('isWebinar') isWebinar?: boolean
  ) {
    const user = req.user;
    const isModerator = this.conferenceService.isUserModerator(user, roomName);
    const { token, exp } = await this.conferenceService.generateJitsiJwt(user, isModerator, roomName, isWebinar);
    return { token, exp, moderator: isModerator };
  }

  /**
 * Génère un JWT Jitsi pour un spectateur (visitor) sans authentification
 * Accessible publiquement pour générer un lien spectateur
 */
  @Post('conferences/:roomName/tokens/jitsi-visitor')
  @Header('Cache-Control', 'no-store')
  async createJitsiVisitorToken(
    @Param('roomName') roomName: RoomNameDto['roomName'],
    @Body() body: any
  ) {
    // Contrôle du flag IS_WEBINAR_ENABLED
    if (process.env.IS_WEBINAR_ENABLED !== 'true') {
      return { error: 'Webinar mode is disabled' };
    }
    // Pas d'utilisateur authentifié, on passe user = undefined
    // On force isWebinar = true pour générer un JWT visitor
    const { token, exp } = await this.conferenceService.generateJitsiJwt(undefined, false, roomName, true);
    return { token, exp, moderator: false };
  }
}
