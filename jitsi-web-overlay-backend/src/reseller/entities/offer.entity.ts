import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { OfferType } from '../enums/offer-type.enum';
import { ModuleKey } from '../enums/module-key.enum';

@Entity('offers')
@Index(['type'], { unique: true })
export class Offer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: OfferType, unique: true })
  type: OfferType;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json' })
  modules: ModuleKey[];

  @Column({ type: 'json', nullable: true })
  limits: {
    maxParticipants?: number;
    replayRetentionDays?: number;
  };

  @Column({ name: 'customization_enabled', type: 'boolean', default: false })
  customizationEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}