import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackType } from '../entities/feedback_type.entity';
import { CreateFeedbackTypeDto, UpdateFeedbackTypeDto } from '../DTOs/feedback_type.dto';

@Injectable()
export class FeedbackTypeService {
  constructor(
    @InjectRepository(FeedbackType)
    private readonly repository: Repository<FeedbackType>,
  ) { }

  async create(dto: CreateFeedbackTypeDto): Promise<FeedbackType> {
    const feedbackType = this.repository.create(dto);
    return this.repository.save(feedbackType);
  }

  async findAll(): Promise<FeedbackType[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<FeedbackType> {
    const feedbackType = await this.repository.findOne({
      where: { id },
    });
    if (!feedbackType) {
      throw new NotFoundException(`Feedback type with id ${id} not found`);
    }
    return feedbackType;
  }

  async update(id: number, dto: UpdateFeedbackTypeDto): Promise<FeedbackType> {
    const feedbackType = await this.findOne(id);
    Object.assign(feedbackType, dto);
    return this.repository.save(feedbackType);
  }

  async remove(id: number): Promise<void> {
    const feedbackType = await this.findOne(id);
    await this.repository.remove(feedbackType);
  }
}