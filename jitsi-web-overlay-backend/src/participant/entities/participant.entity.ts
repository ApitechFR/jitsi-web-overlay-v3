import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, JoinColumn, Index
} from 'typeorm';
import { Conference } from '../../conference/entities/conference.entity';
import { User } from 'src/users/entities/users.entity';
import { ParticipantSession } from './participant-session.entity';
import { InviteMethod, ParticipantRole, ParticipantStatus } from '../participant.enums';


@Entity('participants')
@Index('ix_participants_conference', ['conference'])
@Index('ix_participants_status', ['status'])
// Un participant "compte" unique par conférence
@Index('uq_participant_conf_user', ['conference', 'user'], {
  unique: true,
  where: 'user_id IS NOT NULL',
})
// Un participant "email" unique par conférence (pour les externes)
@Index('uq_participant_conf_email', ['conference', 'email'], {
  unique: true,
  where: 'email IS NOT NULL',
})
export class Participant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uid: string;

  @ManyToOne(() => Conference, (c) => c.participants, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'conference_id' })
  conference!: Conference;

  @ManyToOne(() => User, (u) => u.participants, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invited_by_user_id' })
  invitedBy?: User | null;

  // Identité “externe” si pas de compte
  @Column({ nullable: true })
  email?: string | null;

  @Column({ length: 32, nullable: true })
  phone?: string | null;

  @Column({ name: 'display_name', length: 128 })
  displayName!: string;

  @Column({ type: 'enum', enum: ParticipantRole, default: ParticipantRole.ATTENDEE })
  role?: ParticipantRole;

  @Column({ type: 'enum', enum: ParticipantStatus, default: ParticipantStatus.INVITED })
  status?: ParticipantStatus;

  @Column({ type: 'enum', enum: InviteMethod, default: InviteMethod.LINK })
  inviteMethod?: InviteMethod;

  @OneToMany(() => ParticipantSession, (s) => s.participant)
  sessions!: ParticipantSession[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
