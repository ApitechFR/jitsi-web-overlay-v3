import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Participant } from '../../participant/entities/participant.entity';
import { Replay } from '../../replay/entities/replay.entity';

@Entity('conferences')
export class Conference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;

  @Column()
  created_by: number;

  @UpdateDateColumn()
  updated_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Participant, (participant) => participant.conference, { cascade: true })
  participants: Participant[];

  @OneToMany(() => Replay, (replay) => replay.conference, { cascade: true })
  replays: Replay[];
}
