import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from '../entities/feedback.entity';
import { IFeedbackService } from '../interfaces/feedback-service.interface';
import { FeedbackDTO } from '../DTOs/feedback.dto';
import { mapDtoToFeedbackEntity } from '../utils/feedback.mapper';


@Injectable()
export class FeedbackServiceSQL implements IFeedbackService<Feedback> {
    constructor(
        @InjectRepository(Feedback)
        private readonly feedbackRepository: Repository<Feedback>,
    ) { }


    async createFeedback(dto: FeedbackDTO, jmmcId: string, ip: string): Promise<Feedback> {
        try {
            const feedbackData = mapDtoToFeedbackEntity(dto, ip, jmmcId);
            const entity = this.feedbackRepository.create(feedbackData);
            return await this.feedbackRepository.save(entity);
        } catch (error) {
            throw new InternalServerErrorException('Impossible de créer le feedback');
        }
    }


    async getAllFeedback() {
        return this.feedbackRepository.find();
    }

    async getFeedbackById(id: string) {
        return this.feedbackRepository.findOne({ where: { id: +id } });
    }

    async deleteFeedback(id: string) {
        await this.feedbackRepository.delete(+id);
    }
}
