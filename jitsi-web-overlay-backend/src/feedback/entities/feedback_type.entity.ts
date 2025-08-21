import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { FeedbackTemplate } from './feedback_template.entity';

@Entity('feedback_type')
export class FeedbackType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string; // exemple: "note", "commentaire", "choix"

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @OneToMany(() => FeedbackTemplate, (template) => template.type)
  templates: FeedbackTemplate[];
}