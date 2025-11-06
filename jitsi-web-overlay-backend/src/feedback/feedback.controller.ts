import {
  Controller,
  Post,
  Req,
  Body,
  BadRequestException,
  Inject,
  Headers,
  Param,
  Get,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateFeedbackDto, FeedbackDTO } from './DTOs/feedback.dto';
import { IFeedbackService } from './interfaces/feedback-service.interface';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { FeedbackTypeService } from './services/feedback_type.service';
import { CreateFeedbackTypeDto, UpdateFeedbackTypeDto } from './DTOs/feedback_type.dto';
import { FeedbackTemplateService } from './services/feedback_template.service';
import { CreateFeedbackTemplateDto, UpdateFeedbackTemplateDto } from './DTOs/feedback_template.dto';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';

@Controller('feedback')
export class FeedbackController {
  constructor(
    @Inject(IFeedbackService)
    private readonly feedbackService: IFeedbackService,
    private readonly feedbackTypeService: FeedbackTypeService,
    private readonly templateService: FeedbackTemplateService
  ) { }

  @Post()
  @ApiOkResponse({ description: '' })
  @ApiBadRequestResponse({ description: 'le serveur jmmc ne repond pas' })
  @ApiBadRequestResponse({
    description: 'vous ne pouvez pas déposer deux avis pour la meme session',
  })
  @ApiNotFoundResponse({
    description:
      "une erreur s'est produite pendant la recherche de l'identifiant et le nom de la conférence",
  })
  @ApiBody({ type: FeedbackDTO })
  async createFeedback(
    @Req() req: Request,
    @Body() body: FeedbackDTO,
    @Headers('webconf-user-region') fromInternetHeader: string,
  ) {
    const ip = req.ip;
    const jmmc_id = req.signedCookies?.['jmmc_objectId'];

    const isFromInternet =
      fromInternetHeader?.toLocaleLowerCase() === 'internet';

    const isValidVPNContext =
      (body.isVPN === -1 && isFromInternet) ||
      ((body.isVPN === 0 || body.isVPN === 1) && !isFromInternet);

    if (!isValidVPNContext) {
      throw new BadRequestException(
        'Veuillez vérifier les informations que vous avez envoyées.',
      );
    }

    return this.feedbackService.createFeedback(
      body,
      jmmc_id,
      ip,
      req.headers['user-agent'],
    );
  }

  @Post('internal')
  createFeedbackInternal(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(dto);
  }
  @Post('internal/bulk')
  async createFeedbackBulk(@Body() dtos: CreateFeedbackDto[]) {
    return this.feedbackService.createFeedbackBulk(dtos);
  }

  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   return this.feedbackService.deleteFeedback(id);
  // }

  // === Feedback par conférence ===
  @UseGuards(JwtAuthGuard)
  @Get('conference/:uuid')
  getFeedbackByConference(@Param('uuid') uuid: string) {
    return this.feedbackService.findByConference(uuid);
  }
  @UseGuards(JwtAuthGuard)
  @Get('conference/:uuid/stats')
  getFeedbackStats(@Param('uuid') uuid: string) {
    return this.feedbackService.getStats(uuid);
  }

  // === FeedbackType Endpoints ===
  @UseGuards(JwtAuthGuard)
  @Post('types')
  createType(@Body() dto: CreateFeedbackTypeDto) {
    return this.feedbackTypeService.create(dto);
  }

  //@UseGuards(JwtAuthGuard)
  @Get('types')
  getAllTypes() {
    return this.feedbackTypeService.findAll();
  }

  //@UseGuards(JwtAuthGuard)
  @Get('types/:id')
  getTypeById(@Param('id') id: number) {
    return this.feedbackTypeService.findOne(id);
  }
  @UseGuards(JwtAuthGuard)
  @Put('types/:id')
  updateType(@Param('id') id: number, @Body() dto: UpdateFeedbackTypeDto) {
    return this.feedbackTypeService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('types/:id')
  deleteType(@Param('id') id: number) {
    return this.feedbackTypeService.remove(id);
  }

  // === FeedbackTemplate Endpoints ===
  @UseGuards(JwtAuthGuard)
  @Post('templates')
  createTemplate(@Body() dto: CreateFeedbackTemplateDto) {
    return this.templateService.create(dto);
  }

  //@UseGuards(JwtAuthGuard)
  @Get('templates')
  getAllTemplates() {
    return this.templateService.findAll();
  }

  //@UseGuards(JwtAuthGuard)
  @Get('templates/organization/:organization')
  findByOrganization(@Param('organization') organization: string) {
    return this.templateService.findByOrganization(organization);
  }

  //@UseGuards(JwtAuthGuard)
  @Get('templates/:id')
  getTemplateById(@Param('id') id: number) {
    return this.templateService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('templates/:id')
  updateTemplate(@Param('id') id: number, @Body() dto: UpdateFeedbackTemplateDto) {
    return this.templateService.update(id, dto);
  }

  //@UseGuards(JwtAuthGuard)
  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: number) {
    return this.templateService.softDelete(id);
  }
}
