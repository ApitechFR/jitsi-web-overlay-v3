import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { OfferType } from '../enums/offer-type.enum';
import { ModuleKey } from '../enums/module-key.enum';

/**
 * Entité Offer - Offres disponibles (statiques: BASIC, PREMIUM)
 * Immuable après création - utilisée en référence par les clients
 */
@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: OfferType, unique: true })
  type: OfferType;

  @Column()
  name: string; // "Basic Offer", "Premium Offer"

  @Column({ nullable: true })
  description: string;

  @Column('json')
  modules: ModuleKey[]; // Array de modules inclus

  @Column('json', { nullable: true })
  limits: {
    maxParticipants?: number;
    replayRetentionDays?: number;
  };

  @Column({ default: false })
  customizationEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // JAMAIS modifiable après création!
}
