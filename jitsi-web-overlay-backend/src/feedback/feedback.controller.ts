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
  Query,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
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
import { FeedbackFilter } from './enums/feedback_filter.enum';
import { ParseFeedbackFilterPipe } from './utils/ParseFeedbackFilterPipe';
import { PaginationDto } from './DTOs/pagination.dto';
import { plainToInstance } from 'class-transformer';

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

  @Get('statistics/organization/:organization')
  @ApiOkResponse({ description: 'Statistiques des feedbacks pour une organisation donnée' })
  @ApiBadRequestResponse({ description: 'Filtre ou dates invalides' })
  async getFeedbackStatsByOrganization(
    @Param('organization') organization: string,
    @Query('filter', new ParseFeedbackFilterPipe()) filter?: FeedbackFilter,
    @Query('start') start?: Date,
    @Query('end') end?: Date,
  ) {

    return this.feedbackService.getStatsByOrganization(
      organization,
      filter,
      start,
      end,
    );
  }


  @Get('statistics/organization/:organization/text')
  async getTextCommentsByOrganization(
    @Param('organization') organization: string,
    @Query('label') label: string,
    @Query() query: any,
    @Query('filter', new ParseFeedbackFilterPipe()) filter?: FeedbackFilter,
    @Query('start') start?: Date,
    @Query('end') end?: Date,
  ) {
    const paginationDto = plainToInstance(PaginationDto, query);

    return this.feedbackService.getTextCommentsByOrganization(
      organization,
      label,
      paginationDto,
      filter,
      start,
      end,
    );
  }

  @Get('export')
  @ApiOkResponse({ description: 'Export des feedbacks en format CSV' })
  async exportFeedbacks(
    @Res() res: Response,
    @Query('filter', new ParseFeedbackFilterPipe()) filter?: FeedbackFilter,
    @Query('start') start?: Date,
    @Query('end') end?: Date,
  ) {
    const csvBuffer = await this.feedbackService.exportFeedbacksToCSV(filter, start, end);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="feedbacks.csv"');
    res.send(csvBuffer);
  }

  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   return this.feedbackService.deleteFeedback(id);
  // }

  // === Feedback par conférence ===
  @Get('conference/:uuid')
  getFeedbackByConference(
    @Param('uuid') uuid: string,
    @Query('filter', new ParseFeedbackFilterPipe()) filter?: FeedbackFilter,
    @Query('start') start?: Date,
    @Query('end') end?: Date,
  ) {
    return this.feedbackService.findByConference(uuid, filter, start, end);
  }

  @Get('conference/:uuid/stats')
  getFeedbackStats(@Param('uuid') uuid: string) {
    return this.feedbackService.getStats(uuid);
  }

  // === FeedbackType Endpoints ===

  @Post('types')
  createType(@Body() dto: CreateFeedbackTypeDto) {
    return this.feedbackTypeService.create(dto);
  }

  @Get('types')
  getAllTypes() {
    return this.feedbackTypeService.findAll();
  }

  @Get('types/:id')
  getTypeById(@Param('id') id: number) {
    return this.feedbackTypeService.findOne(id);
  }

  @Put('types/:id')
  updateType(@Param('id') id: number, @Body() dto: UpdateFeedbackTypeDto) {
    return this.feedbackTypeService.update(id, dto);
  }

  @Delete('types/:id')
  deleteType(@Param('id') id: number) {
    return this.feedbackTypeService.remove(id);
  }

  // === FeedbackTemplate Endpoints ===

  @Post('templates')
  createTemplate(@Body() dto: CreateFeedbackTemplateDto) {
    return this.templateService.create(dto);
  }

  @Get('templates')
  getAllTemplates() {
    return this.templateService.findAll();
  }

  @Get('templates/organization/:organization')
  findByOrganization(@Param('organization') organization: string) {
    return this.templateService.findByOrganization(organization);
  }

  @Get('templates/:id')
  getTemplateById(@Param('id') id: number) {
    return this.templateService.findOne(id);
  }

  @Put('templates/:id')
  updateTemplate(@Param('id') id: number, @Body() dto: UpdateFeedbackTemplateDto) {
    return this.templateService.update(id, dto);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: number) {
    return this.templateService.softDelete(id);
  }
}