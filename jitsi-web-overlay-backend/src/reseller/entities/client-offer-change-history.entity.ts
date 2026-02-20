import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Client } from './client.entity';
import { OfferType } from '../enums/offer-type.enum';

@Entity('client_offer_changes_history')
@Index(['client', 'status'])
@Index(['effectiveDate'])
export class ClientOfferChangeHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'from_offer', type: 'enum', enum: OfferType })
  fromOffer: OfferType;

  @Column({ name: 'to_offer', type: 'enum', enum: OfferType })
  toOffer: OfferType;

  @Column({
    type: 'enum',
    enum: ['pending', 'applied', 'cancelled'],
    default: 'pending',
  })
  status: 'pending' | 'applied' | 'cancelled';

  @Column({
    name: 'effective_date',
    type: 'datetime',
    nullable: true,
    comment: 'Effective date of the change (NULL = immediate)',
  })
  effectiveDate?: Date;

  @Column({
    name: 'applied_at',
    type: 'datetime',
    nullable: true,
    comment: 'Date when the change was actually applied',
  })
  appliedAt?: Date;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Metadata about the change (downgrade options, etc.)',
  })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}