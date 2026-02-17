import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Client } from './client.entity';
import { OfferType } from '../enums/offer-type.enum';


/**
 * Entity ClientOfferChangeHistory - History of offer changes
 * Full traceability of upgrades/downgrades with dates
 * Status: pending (scheduled), applied (executed), cancelled (cancelled) 
 */
@Entity('client_offer_changes_history')
@Index(['client', 'status'])
@Index(['effectiveDate'])
export class ClientOfferChangeHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ type: 'enum', enum: OfferType })
  fromOffer: OfferType;

  @Column({ type: 'enum', enum: OfferType })
  toOffer: OfferType;

  @Column({
    type: 'enum',
    enum: ['pending', 'applied', 'cancelled'],
    default: 'pending',
  })
  status: 'pending' | 'applied' | 'cancelled';

  @Column({ nullable: true, comment: 'Effective date of the change (NULL = immediate)' })
  effectiveDate?: Date;

  @Column({ nullable: true, comment: 'Date when the change was actually applied' })
  appliedAt?: Date;

  @Column({ type: 'json', nullable: true, comment: 'Metadata about the change (downgrade options, etc.)' })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
