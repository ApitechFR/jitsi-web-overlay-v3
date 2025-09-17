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
import { ParseConferenceFilterPipe } from '../../utils/ParseConferenceFilterPipe';

interface AuthenticatedRequest extends Request {
  user?: any;
}

@ApiTags('Conferences')
@Controller('')
export class ConferenceController {
  constructor(
    @Inject(IConferenceService)
    private readonly conferenceService: IConferenceService,
  ) { }

  @Post('conferences')
  @ApiOkResponse({ description: 'Conférence créée avec succès' })
  async create(@Body() dto: CreateConferenceDTO) {
    return this.conferenceService.create(dto);
  }

  @Get('conferences')
  @ApiOkResponse({ description: 'Liste des conférences' })
  async findAll() {
    return this.conferenceService.findAll();
  }

  @Get("conferences/statistics")
  @ApiOkResponse({ description: "Statistiques des conférences" })
  @ApiBadRequestResponse({ description: "Filtre invalide" })
  async getStatistics(@Query("filter", new ParseConferenceFilterPipe()) filter?: ConferenceFilter) {
    if (filter) {
      return this.conferenceService.getStatisticsByFilter(filter);
    }
    return this.conferenceService.getGlobalStatistics();
  }

  @Get('conferences/:uid/duration')
  async getDuration(@Param('uid') uid: string): Promise<{ duration: string }> {
    const duration = await this.conferenceService.getDuration(uid);
    return { duration };
  }

  @Get('conferences/:id')
  @ApiOkResponse({ description: 'Conférence trouvée' })
  @ApiNotFoundResponse({ description: 'Conférence non trouvée' })
  async findOne(@Param('id') id: string) {
    return this.conferenceService.findOne(id);
  }

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

  @Put('conferences/confname/:confName')
  async updateEndTime(
    @Param('confName') confName: string,
    @Body() dto: EndConferenceDTO,
  ) {
    return this.conferenceService.updateEndTimeConferenceByName(confName, dto.end_time);
  }

  //TODO : to remove Old name /roomExists/:roomName
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
  @Post('verify-token')
  @ApiOkResponse({ description: 'JWT vérifié avec succès' })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  async verifyToken(@Body() dto: JwtDTO) {
    return this.conferenceService.verifyToken(dto.jwt);
  }

  //TODO update new name :old name /:roomName
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


  @Post('conferences/:roomName/tokens/jitsi')
  @Header('Cache-Control', 'no-store')
  async createJitsiToken(
    @Param('roomName') roomName: RoomNameDto['roomName'],
    @Req() req: AuthenticatedRequest
  ) {

    const user = req.user;
    const isModerator = this.conferenceService.isUserModerator(user, roomName);

    const { token, exp } = await this.conferenceService.generateJitsiJwt(user, isModerator, roomName);

    return { token, exp, moderator: isModerator };
  }
}
