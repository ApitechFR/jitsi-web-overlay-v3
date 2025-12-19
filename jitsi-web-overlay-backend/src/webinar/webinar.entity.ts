import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('webinar_invitations')
export class WebinarInvitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column({ length: 32 })
    token: string;

    @Column()
    roomName: string;

    @Column('text')
    jwt: string;

    @Column({ default: 'visitor' })
    type: string; // 'visitor' ou autre

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    expiresAt: Date | null;
}
