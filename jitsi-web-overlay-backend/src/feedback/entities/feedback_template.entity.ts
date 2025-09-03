import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { FeedbackType } from './feedback_type.entity';
import { Feedback } from './feedback.entity';

@Entity('feedback_template')
export class FeedbackTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  label: string;

  @ManyToOne(() => FeedbackType, (type) => type.templates, { eager: true })
  type: FeedbackType;

  @Column({ type: 'json', nullable: true })
  choices: string[];

  @Column({ type: 'varchar', nullable: true })
  organization: string;

  @Column({ type: 'datetime', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Feedback, (feedback) => feedback.feedbackTemplate)
  feedbacks: Feedback[];
}
