import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from 'typeorm';

@Entity()
export class Feedback {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    clientID: number;

    @Column({ nullable: true })
    room: string;

    @Column('int')
    evaluation: number;

    @Column('text', { nullable: true })
    comment: string;

    @Column({ nullable: true })
    userAgent: string;

    @Column({ nullable: true })
    jmmc_id: string;

    @Column('int', { nullable: true })
    ip: number;

    @CreateDateColumn()
    date: Date;
}
