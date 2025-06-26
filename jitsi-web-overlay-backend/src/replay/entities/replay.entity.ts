// import { Conference } from 'src/conference/entities/conference.entity';
import { Conference } from '../../conference/entities/conference.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('replay')
export class Replay {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Conference, (conference) => conference.replays)
  @JoinColumn({ name: 'conference_id' })
  conference: Conference;

  @Column({ type: 'char' })
  file_path: string;

  @Column({ type: 'time' })
  duration: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'varchar' })
  status: string;

  @Column()
  added_by: number;
}
