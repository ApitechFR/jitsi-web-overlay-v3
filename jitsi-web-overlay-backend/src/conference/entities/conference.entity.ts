import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
  ManyToMany,
} from 'typeorm';
import { Participant } from '../../participant/entities/participant.entity';
import { Replay } from '../../replay/entities/replay.entity';
import { Room } from '../../room/entities/room.entity';
import { User } from '../../users/entities/users.entity';
import { ConferenceStatus } from '../enum/conference_status.enum';
import { OfferType } from '../../reseller/enums/offer-type.enum';

@Entity('conferences')
export class Conference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uid!: string;

  @Column()
  name: string;

  @Column({ name: 'start_time', type: 'timestamp' })
  start_time!: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  end_time!: Date | null;

  // Statut métier
  @Column({ type: 'enum', enum: ConferenceStatus, default: ConferenceStatus.DRAFT })
  status!: ConferenceStatus;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  // Multi-tenant: UUID du client (null en mode single-tenant)
  @Column({ name: 'client_id', type: 'varchar', length: 36, nullable: true })
  clientId?: string | null;

  // Type d'offre au moment de la création (pour audit/facturation)
  @Column({
    name: 'offer_type_at_creation',
    type: 'enum',
    enum: OfferType,
    nullable: true,
    comment: 'Type d\'offre du client au moment de la création de la conférence',
  })
  offerTypeAtCreation?: OfferType | null;

  @OneToMany(() => Participant, (participant) => participant.conference, {
    cascade: true,
  })
  participants!: Participant[];


  @OneToMany(() => Replay, (replay) => replay.conference, { cascade: true })
  replays!: Replay[];


  @JoinColumn({ name: 'room_uid', referencedColumnName: 'uid' })
  @ManyToOne(() => Room, (room) => room.conferences, { nullable: true, onDelete: 'SET NULL' })
  room?: Room | null;

  // Organisateurs ou createurs de la conférence
  @ManyToMany(() => User, u => u.organizedConferences, { cascade: false })
  organizers!: User[];

  @Column({ name: 'desactivated_at', type: 'timestamp', nullable: true })
  desactivated_at!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at!: Date;

}
