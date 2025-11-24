import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackTemplate } from '../entities/feedback_template.entity';
import { FeedbackType } from '../entities/feedback_type.entity';
import { CreateFeedbackTemplateDto, UpdateFeedbackTemplateDto } from '../DTOs/feedback_template.dto';

@Injectable()
export class FeedbackTemplateService {
  constructor(
    @InjectRepository(FeedbackTemplate)
    private readonly templateRepo: Repository<FeedbackTemplate>,

    @InjectRepository(FeedbackType)
    private readonly typeRepo: Repository<FeedbackType>,
  ) { }

  async create(dto: CreateFeedbackTemplateDto): Promise<FeedbackTemplate> {
    const type = await this.typeRepo.findOne({ where: { id: dto.typeId } });
    if (!type) throw new NotFoundException(`Feedback type with id ${dto.typeId} not found`);

    const template = this.templateRepo.create({
      label: dto.label,
      type,
      choices: dto.choices || null,
      organization: dto.organization || null,
    });

    return this.templateRepo.save(template);
  }

  async findAll(): Promise<FeedbackTemplate[]> {
    return this.templateRepo.find({
      where: { deletedAt: null },
      relations: ['type', 'feedbacks'],
    });
  }

  async findOne(id: number): Promise<FeedbackTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id, deletedAt: null },
      relations: ['type', 'feedbacks'],
    });
    if (!template) throw new NotFoundException(`Feedback template with id ${id} not found`);
    return template;
  }

  // Soft delete
  async softDelete(id: number): Promise<void> {
    const template = await this.findOne(id);
    template.deletedAt = new Date();
    await this.templateRepo.save(template);
  }

  async update(id: number, dto: UpdateFeedbackTemplateDto): Promise<FeedbackTemplate> {
    const template = await this.findOne(id);

    if (dto.typeId) {
      const type = await this.typeRepo.findOne({ where: { id: dto.typeId } });
      if (!type) throw new NotFoundException(`Feedback type with id ${dto.typeId} not found`);
      template.type = type;
    }

    if (dto.label) template.label = dto.label;
    if (dto.choices) template.choices = dto.choices;
    if (dto.organization) template.organization = dto.organization;

    return this.templateRepo.save(template);
  }

  async findByOrganization(organization: string): Promise<FeedbackTemplate[]> {
    const templates = await this.templateRepo.find({
      where: { organization, deletedAt: null },
    });

    if (!templates.length) {
      throw new NotFoundException(`No templates found for organization: ${organization}`);
    }

    return templates;
  }
}