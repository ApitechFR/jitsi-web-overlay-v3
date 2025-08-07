import { Conference } from '../../conference/entities/conference.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReplayStatus } from '../enum/replay_status.enum';

@Entity('replay')
export class Replay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', nullable: true })
  uid: string;

  @Column({ type: 'varchar', nullable: true })
  file_path: string;

  @Column({ type: 'enum', enum: ReplayStatus, nullable: true})
  status: ReplayStatus;

  @Column({ type: 'varchar', nullable: true })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  conference_name: string;

  @ManyToOne(() => Conference, (conference) => conference.replays, {
    nullable: true,
  })
  @JoinColumn({ name: 'conference_uid', referencedColumnName: 'uid' })
  conference: Conference;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @CreateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
