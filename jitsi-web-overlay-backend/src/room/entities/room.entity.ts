import { Entity, PrimaryGeneratedColumn, Column, OneToMany, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { Conference } from '../../conference/entities/conference.entity';

@Entity('rooms')
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    uid: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    created_by: string;

    @UpdateDateColumn()
    updated_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @OneToMany(() => Conference, (conference) => conference.room)
    conferences: Conference[];
}