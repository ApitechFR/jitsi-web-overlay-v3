import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Feedback } from '../entities/feedback.entity';
import { FeedbackTemplate } from '../entities/feedback_template.entity';
import { CreateFeedbackDto } from '../DTOs/feedback.dto';
import { IFeedbackService } from '../interfaces/feedback-service.interface';
import { Conference } from '../../conference/entities/conference.entity';
import { Parser } from 'json2csv';
import * as moment from 'moment';
import { PaginationDto } from '../DTOs/pagination.dto';
import { getDateRangeByFilter } from '../../common/utils/GetDateRangeByFilter';
import { DashboardFilter } from '../../common/enum/dashboard_filter.enum';

@Injectable()
export class FeedbackServiceSQL implements IFeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
    @InjectRepository(FeedbackTemplate)
    private readonly templateRepo: Repository<FeedbackTemplate>,
    @InjectRepository(Conference)
    private readonly conferanceRepo: Repository<Conference>,
  ) { }

  // Create a feedback
  async createFeedback(dto: CreateFeedbackDto): Promise<Feedback> {
    const template = await this.templateRepo.findOne({ where: { id: dto.feedbackTemplateId } });
    if (!template) throw new NotFoundException(`Feedback template with id ${dto.feedbackTemplateId} not found`);

    const conference = await this.conferanceRepo.findOne({ where: { name: dto.conference_name }, order: { created_at: 'DESC' }, });
    if (!conference) throw new NotFoundException(`Conference with name ${dto.conference_name} not found`);

    if (!dto.reponse || Object.keys(dto.reponse).length === 0) {
      return null;
    }

    const feedback = this.feedbackRepo.create({
      feedbackTemplate: template,
      conferenceUuid: conference.uid,
      date: new Date(dto.date),
      userAgent: dto.userAgent,
      reponse: dto.reponse,
    });

    return this.feedbackRepo.save(feedback);
  }
  /**
   * craetion de multiples feedbacks
   * @param dtos CreateFeedbackDto[]
   * @returns les feedbacks créés
   */
  async createFeedbackBulk(dtos: CreateFeedbackDto[]): Promise<Feedback[]> {
    const feedbacks: Feedback[] = [];
    for (const dto of dtos) {
      const template = await this.templateRepo.findOne({ where: { id: dto.feedbackTemplateId } });
      if (!template) throw new NotFoundException(`Feedback template with id ${dto.feedbackTemplateId} not found`);

      const conference = await this.conferanceRepo.findOne({ where: { name: dto.conference_name }, order: { created_at: 'DESC' }, });
      if (!conference) throw new NotFoundException(`Conference with name ${dto.conference_name} not found`);

      if (!dto.reponse || Object.keys(dto.reponse).length === 0) {
        continue;
      }

      const feedback = this.feedbackRepo.create({
        feedbackTemplate: template,
        conferenceUuid: conference.uid,
        date: new Date(dto.date),
        userAgent: dto.userAgent,
        reponse: dto.reponse,
      });
      feedbacks.push(feedback);
    }
    return this.feedbackRepo.save(feedbacks);
  }

  /**
   * Récupère les feedbacks d'une conférence donnée avec des options de filtrage.
   * @param uuid L'UUID de la conférence.
   * @param filter Le filtre de Dashboard (optionnel).
   * @param start_time La date de début de la plage (optionnelle).
   * @param end_time La date de fin de la plage (optionnelle).
   * @returns Une liste de feedbacks correspondant aux critères spécifiés.
   */
  async findByConference(uuid: string, filter?: DashboardFilter, start_time?: Date, end_time?: Date): Promise<Feedback[]> {
    let start: Date;
    let end: Date;

    if (filter) {
      ({ start, end } = getDateRangeByFilter(filter));
    } else if (start_time && end_time) {
      start = new Date(start_time);
      end = new Date(end_time);
    }

    const where: any = { conferenceUuid: uuid };

    if (start && end) {
      where.date = Between(start, end);
    }

    return this.feedbackRepo.find({
      where,
      relations: ['feedbackTemplate'],
      order: { date: 'DESC' },
    });
  }

  /**
   * Calcule les statistiques des feedbacks pour une conférence donnée.
   * @param uuid L'UUID de la conférence.
   * @returns Un objet contenant les statistiques des feedbacks.
   */
  async getStats(uuid: string): Promise<any> {
    const feedbacks = await this.findByConference(uuid);

    if (feedbacks.length === 0) {
      return { total: 0, byTemplate: {} };
    }

    const stats = feedbacks.reduce((acc, f) => {
      const templateLabel = f.feedbackTemplate.label;

      if (!acc.byTemplate[templateLabel]) {
        acc.byTemplate[templateLabel] = { label: f.feedbackTemplate.label, count: 0, responses: [] };
      }

      acc.byTemplate[templateLabel].count++;
      acc.byTemplate[templateLabel].responses.push(f.reponse);

      return acc;
    }, { total: feedbacks.length, byTemplate: {} });

    return stats;
  }

  /**
   * Récupère les feedbacks de type text pour une organisation donnée avec pagination et filtrage.
   * @param organization L'organisation pour laquelle récupérer les commentaires.
   * @param label Le label du feedback template.
   * @param param2 Les options de pagination.
   * @param filter Le filtre de Dashboard (optionnel).
   * @param start_time La date de début de la plage (optionnelle).
   * @param end_time La date de fin de la plage (optionnelle).
   * @returns Un objet contenant les commentaires textuels et les informations de pagination.
   */
  async getTextCommentsByOrganization(
    organization: string,
    label: string,
    { page = 1, limit = 20 }: PaginationDto,
    filter?: DashboardFilter,
    start_time?: Date,
    end_time?: Date,
  ) {
    let start: Date;
    let end: Date;

    if (filter) {
      ({ start, end } = getDateRangeByFilter(filter));
    } else if (start_time && end_time) {
      start = new Date(start_time);
      end = new Date(end_time);
    } else {
      start = new Date('1970-01-01');
      end = new Date();
    }

    const [feedbacks, total] = await this.feedbackRepo.findAndCount({
      where: {
        feedbackTemplate: {
          organization,
          label, //  pagination by question
          type: { name: 'text' },
        },
        date: Between(start, end),
      },
      relations: ['feedbackTemplate', 'feedbackTemplate.type'],
      order: { date: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const responses = feedbacks.map(f => f.reponse);

    return {
      label,
      responses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  /**
   * Récupère les statistiques des feedbacks pour une organisation donnée avec des options de filtrage.
   * @param organization L'organisation pour laquelle récupérer les statistiques.
   * @param filter Le filtre de Dashboard (optionnel).
   * @param start_time La date de début de la plage (optionnelle).
   * @param end_time La date de fin de la plage (optionnelle).
   * @returns Un objet contenant les statistiques des feedbacks.
   */
  async getStatsByOrganization(
    organization: string,
    filter?: DashboardFilter,
    start_time?: Date,
    end_time?: Date,
  ): Promise<any> {
    let start: Date;
    let end: Date;

    if (filter) {
      ({ start, end } = getDateRangeByFilter(filter));
    } else if (start_time && end_time) {
      start = new Date(start_time);
      end = new Date(end_time);
    } else {
      start = new Date('1970-01-01');
      end = new Date();
    }

    const feedbacks = await this.feedbackRepo.find({
      where: {
        feedbackTemplate: {
          organization,
        },
        date: Between(start, end),
      },
      relations: ['feedbackTemplate', 'feedbackTemplate.type'],
    });

    if (feedbacks.length === 0) {
      return { total: 0, rating: {}, radio: {}, text: {} };
    }

    const ratingStats = this.ratingStats(feedbacks);
    const radioStats = this.radioStats(feedbacks);

    // text only contains global info (count), no slicing by page
    const textStatsMeta = this.textStatsMeta(feedbacks);

    return {
      total: feedbacks.length,
      rating: ratingStats,
      radio: radioStats,
      text: textStatsMeta,
    };
  }

  /**
   * Calcule les statistiques des feedbacks de type text.
   * @param feedbacks La liste des feedbacks à analyser.
   * @returns Un objet contenant les statistiques des feedbacks textuels.
   */
  private textStatsMeta(feedbacks: Feedback[]) {
    const textFeedbacks = feedbacks.filter(
      f => f.feedbackTemplate?.type?.name === 'text',
    );

    const stats = {};

    for (const f of textFeedbacks) {
      const label = f.feedbackTemplate.label;

      if (!stats[label]) {
        stats[label] = {
          count: 0,
        };
      }

      stats[label].count++;
    }

    return stats;
  }

  /**
   * Calcule les statistiques des feedbacks de type rating.
   * @param feedbacks La liste des feedbacks à analyser.
   * @returns Un objet contenant les statistiques des feedbacks de type rating.
   */
  private ratingStats(feedbacks: Feedback[]) {
    const ratingFeedbacks = feedbacks.filter(
      (f) => f.feedbackTemplate?.type?.name === 'rating',
    );

    const stats = {};

    for (const f of ratingFeedbacks) {
      const label = f.feedbackTemplate.label;
      const note = parseFloat(f.reponse);

      if (!stats[label]) {
        stats[label] = { count: 0, sum: 0 };
      }

      if (!isNaN(note)) {
        stats[label].count++;
        stats[label].sum += note;
      }
    }

    for (const label in stats) {
      const { count, sum } = stats[label];
      stats[label].moy = count > 0 ? +(sum / count).toFixed(2) : 0;
      delete stats[label].sum;
    }

    return stats;
  }

  /**
   * Calcule les statistiques des feedbacks de type radio.
   * @param feedbacks La liste des feedbacks à analyser.
   * @returns Un objet contenant les statistiques des feedbacks de type radio.
   */
  private radioStats(feedbacks: Feedback[]) {
    const radioFeedbacks = feedbacks.filter(
      (f) => f.feedbackTemplate?.type?.name?.toLowerCase() === 'radio',
    );

    const stats = {};

    for (const f of radioFeedbacks) {
      const template = f.feedbackTemplate;
      const label = template.label;
      const choice = f.reponse;

      if (!stats[label]) {
        // Initialization of the label
        stats[label] = {
          count: 0,
          choicesStats: {},
        };

        // Initialize all choices of the template
        if (Array.isArray(template.choices)) {
          for (const c of template.choices) {
            stats[label].choicesStats[c] = 0;
          }
        }
      }

      stats[label].count++;

      if (choice && stats[label].choicesStats.hasOwnProperty(choice)) {
        stats[label].choicesStats[choice]++;
      } else if (choice) {
        stats[label].choicesStats[choice] = 1;
      }
    }

    return stats;
  }

  /**
   * Exporte les feedbacks au format CSV avec des options de filtrage.
   * @param filter Le filtre de Dashboard (optionnel).
   * @param start_time La date de début de la plage (optionnelle).
   * @param end_time La date de fin de la plage (optionnelle).
   * @returns Un buffer contenant les données CSV.
   */
  async exportFeedbacksToCSV(filter?: DashboardFilter, start_time?: Date, end_time?: Date): Promise<Buffer> {
    let start: Date;
    let end: Date;

    if (filter) {
      ({ start, end } = getDateRangeByFilter(filter));
    } else if (start_time && end_time) {
      start = new Date(start_time);
      end = new Date(end_time);
    } else {
      start = new Date('1970-01-01');
      end = new Date();
    }

    const feedbacks = await this.feedbackRepo.find({
      where: {
        date: Between(start, end),
      },
      relations: ['feedbackTemplate'],
      order: { date: 'DESC' },
    });

    if (feedbacks.length === 0) {
      throw new NotFoundException('Aucun feedback trouvé pour la période spécifiée.');
    }

    const conferenceUuids = [...new Set(feedbacks.map(f => f.conferenceUuid))];

    const conferences = await this.conferanceRepo.find({
      where: { uid: In(conferenceUuids) },
    });

    const confMap = new Map(conferences.map(c => [c.uid, c.name]));

    const data = feedbacks.map((f) => ({
      Organization: f.feedbackTemplate.organization || 'N/A',
      Question: f.feedbackTemplate.label,
      Type: f.feedbackTemplate.type?.name,
      Reponse: f.reponse,
      Conference: confMap.get(f.conferenceUuid) || 'N/A',
      Date: moment(f.date).format('YYYY-MM-DD HH:mm:ss'),
    }));

    const fields = ['Organization', 'Question', 'Type', 'Reponse', 'Conference', 'Date'];
    const parser = new Parser({ fields, delimiter: ';' });
    const csv = parser.parse(data);

    const bom = '\ufeff';

    return Buffer.from(bom + csv, 'utf-8');
  }

}