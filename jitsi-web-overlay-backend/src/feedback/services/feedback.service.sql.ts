import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from '../entities/feedback.entity';
import { FeedbackTemplate } from '../entities/feedback_template.entity';
import { CreateFeedbackDto, FeedbackDTO } from '../DTOs/feedback.dto';
import { IFeedbackService } from '../interfaces/feedback-service.interface';

@Injectable()
export class FeedbackServiceSQL implements IFeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,

    @InjectRepository(FeedbackTemplate)
    private readonly templateRepo: Repository<FeedbackTemplate>,
  ) { }

  // Créer un feedback
  async createFeedback(dto: CreateFeedbackDto): Promise<Feedback> {
    const template = await this.templateRepo.findOne({ where: { id: dto.feedbackTemplateId } });
    if (!template) throw new NotFoundException(`Feedback template with id ${dto.feedbackTemplateId} not found`);

    const feedback = this.feedbackRepo.create({
      feedbackTemplate: template,
      conferenceUuid: dto.conferenceUuid,
      date: new Date(dto.date),
      userAgent: dto.userAgent,
      reponse: dto.reponse,
    });

    return this.feedbackRepo.save(feedback);
  }
  // Créer plusieurs feedbacks en bulk
  async createFeedbackBulk(dtos: CreateFeedbackDto[]): Promise<Feedback[]> {
    const feedbacks: Feedback[] = [];
    for (const dto of dtos) {
      const template = await this.templateRepo.findOne({ where: { id: dto.feedbackTemplateId } });
      if (!template) throw new NotFoundException(`Feedback template with id ${dto.feedbackTemplateId} not found`);
      const feedback = this.feedbackRepo.create({
        feedbackTemplate: template,
        conferenceUuid: dto.conferenceUuid,
        date: new Date(dto.date),
        userAgent: dto.userAgent,
        reponse: dto.reponse,
      });
      feedbacks.push(feedback);
    }
    return this.feedbackRepo.save(feedbacks);
  }

  async findAll(): Promise<Feedback[]> {
    return this.feedbackRepo.find({
      relations: ['feedbackTemplate'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Feedback> {
    const feedback = await this.feedbackRepo.findOne({
      where: { id },
      relations: ['feedbackTemplate'],
    });

    if (!feedback) throw new NotFoundException(`Feedback with ID ${id} not found`);

    return feedback;
  }

  // Récupérer tous les feedbacks pour une conférence
  async findByConference(uuid: string): Promise<Feedback[]> {
    return this.feedbackRepo.find({
      where: { conferenceUuid: uuid },
      relations: ['feedbackTemplate'],
      order: { date: 'DESC' },
    });
  }

  // Obtenir des statistiques simples pour une conférence
  async getStats(uuid: string): Promise<any> {
    const feedbacks = await this.findByConference(uuid);

    if (feedbacks.length === 0) {
      return { total: 0, byTemplate: {} };
    }

    const stats = feedbacks.reduce((acc, f) => {
      const templateLabel = f.feedbackTemplate.label;

      if (!acc.byTemplate[templateLabel]) {
        acc.byTemplate[templateLabel] = { count: 0, responses: [] };
      }

      acc.byTemplate[templateLabel].count++;
      acc.byTemplate[templateLabel].responses.push(f.reponse);

      return acc;
    }, { total: feedbacks.length, byTemplate: {} });

    return stats;
  }

}
