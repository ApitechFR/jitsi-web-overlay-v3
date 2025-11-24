import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Feedback } from '../entities/feedback.entity';
import { FeedbackTemplate } from '../entities/feedback_template.entity';
import { CreateFeedbackDto } from '../DTOs/feedback.dto';
import { IFeedbackService } from '../interfaces/feedback-service.interface';
import { FeedbackFilter } from '../enums/feedback_filter.enum';
import { Conference } from '../../conference/entities/conference.entity';
import { Parser } from 'json2csv';
import * as moment from 'moment';
import { PaginationDto } from '../DTOs/pagination.dto';

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
  // Create multiple feedbacks in bulk
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

  // Retrieve all feedbacks for a conference
  async findByConference(uuid: string, filter?: FeedbackFilter, start_time?: Date, end_time?: Date): Promise<Feedback[]> {
    let start: Date;
    let end: Date;

    if (filter) {
      ({ start, end } = this.getDateRangeByFilter(filter));
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

  async getTextCommentsByOrganization(
    organization: string,
    label: string,
    { page = 1, limit = 20 }: PaginationDto,
    filter?: FeedbackFilter,
    start_time?: Date,
    end_time?: Date,
  ) {
    let start: Date;
    let end: Date;

    if (filter) {
      ({ start, end } = this.getDateRangeByFilter(filter));
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


  async getStatsByOrganization(
    organization: string,
    filter?: FeedbackFilter,
    start_time?: Date,
    end_time?: Date,
  ): Promise<any> {
    let start: Date;
    let end: Date;

    if (filter) {
      ({ start, end } = this.getDateRangeByFilter(filter));
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

  private textStats(feedbacks: Feedback[], page = 1, limit = 20) {
    const textFeedbacks = feedbacks.filter(
      (f) => f.feedbackTemplate?.type?.name === 'text',
    );

    const stats = {};

    for (const f of textFeedbacks) {
      const label = f.feedbackTemplate.label;

      if (!stats[label]) {
        stats[label] = {
          count: 0,
          responses: [],
          pagination: {
            page,
            limit,
            totalPages: 1,
            total: 0,
          },
        };
      }

      stats[label].count++;
      stats[label].responses.push(f.reponse);
    }

    for (const label of Object.keys(stats)) {
      const allResponses = stats[label].responses;

      const total = allResponses.length;
      const totalPages = Math.ceil(total / limit);

      const start = (page - 1) * limit;
      const end = start + limit;

      stats[label].responses = allResponses.slice(start, end);

      stats[label].pagination = {
        page,
        limit,
        totalPages,
        total,
      };
    }

    return stats;
  }

  async exportFeedbacksToCSV(filter?: FeedbackFilter, start_time?: Date, end_time?: Date): Promise<Buffer> {
    let start: Date;
    let end: Date;

    if (filter) {
      ({ start, end } = this.getDateRangeByFilter(filter));
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

    return Buffer.from(csv, 'utf-8');
  }


  private getDateRangeByFilter(filter: FeedbackFilter): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (filter) {
      case FeedbackFilter.TODAY:
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;

      case FeedbackFilter.WEEK:
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start = new Date(now);
        start.setDate(now.getDate() + diffToMonday);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;

      case FeedbackFilter.MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case FeedbackFilter.YEAR:
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      default:
        throw new NotFoundException(`Invalid filter: ${filter}`);
    }

    return { start, end };
  }

}