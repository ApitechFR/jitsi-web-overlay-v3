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
} from '@nestjs/common';
import { Request } from 'express';
import { FeedbackDTO } from './DTOs/feedback.dto';
import { IFeedbackService } from './interfaces/feedback-service.interface';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@Controller('feedback')
export class FeedbackController {
  constructor(
    @Inject(IFeedbackService)
    private readonly feedbackService: IFeedbackService,
  ) {}

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

  @Get()
  async getAll() {
    return this.feedbackService.getAllFeedback();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.feedbackService.getFeedbackById(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.feedbackService.deleteFeedback(id);
  }
}
