import { FeedbackDTO } from './DTOs/feedback.dto';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Feedback } from '../schemas/Feedback.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);
  constructor(
    @InjectModel(Feedback.name) private readonly feedbackModel: Model<Feedback>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async createFeedback(body: FeedbackDTO, jmmc_id: string, ip: string) {
    const { data } = await firstValueFrom(
      this.httpService
        .get(
          this.configService.get('JMMC_URL') + '/objectId?jmmc_id=' + jmmc_id,
        )
        .pipe(
          catchError((err: any) => {
            if (err.response?.data) {
              throw new NotFoundException(err.response.data.message);
            }
            this.logger.error('le serveur jmmc ne repond pas');
            throw new BadRequestException('le serveur jmmc ne repond pas');
          }),
        ),
    );
    if (data) {
      const allreadyExists = await this.feedbackModel.findById(jmmc_id);
      if (!allreadyExists) {
        const metric = new this.feedbackModel({
          ip: this.ip2int(ip),
          ...body,
          jmmc_id,
        });
        return metric.save();
      } else {
        this.logger.error(
          'vous ne pouvez pas déposer deux avis pour la meme session',
        );
        throw new BadRequestException(
          'vous ne pouvez pas déposer deux avis pour la meme session',
        );
      }
    } else {
      this.logger.error(
        "une erreur s'est produite pendant la recherche de l'identifiant et le nom de la conférence",
      );
      throw new NotFoundException(
        "une erreur s'est produite pendant la recherche de l'identifiant et le nom de la conférence",
      );
    }
  }

  ip2int(ip) {
    return (
      ip.split('.').reduce(function (ipInt, octet) {
        return (ipInt << 8) + parseInt(octet, 10);
      }, 0) >>> 0
    );
  }
}
