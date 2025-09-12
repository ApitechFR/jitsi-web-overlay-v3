import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { FeedbackTemplate } from './feedback_template.entity';

@Entity('feedback')
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FeedbackTemplate, (template) => template.feedbacks, { eager: true })
  feedbackTemplate: FeedbackTemplate;

  @Column({ type: 'char', length: 36 })
  conferenceUuid: string;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'varchar', length: 255 })
  userAgent: string;

  @Column({ type: 'text' })
  reponse: string;
}
