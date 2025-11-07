import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Participant } from './participant.entity';

@Entity('participant_sessions')
export class ParticipantSession {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Participant, (p) => p.sessions, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'participant_id' })
    participant!: Participant;

    @Column({ name: 'join_at', type: 'timestamp' })
    joinAt!: Date;

    @Column({ name: 'leave_at', type: 'timestamp', nullable: true })
    leaveAt?: Date | null;

    @Column({ type: 'varchar', length: 64, nullable: true })
    ip?: string | null;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent?: string | null;

    @Column({ name: 'was_moderator', type: 'boolean', default: false })
    wasModerator!: boolean;
}
