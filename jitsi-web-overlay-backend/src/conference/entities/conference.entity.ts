import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Participant } from '../../participant/entities/participant.entity';
import { Replay } from '../../replay/entities/replay.entity';
import { Room } from '../../room/entities/room.entity';

@Entity('conferences')
export class Conference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date | null;

  @Column({ unique: true })
  uid: string;

  @Column()
  status: string;

  @UpdateDateColumn()
  updated_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Participant, (participant) => participant.conference, {
    cascade: true,
  })
  participants: Participant[];

  @OneToMany(() => Replay, (replay) => replay.conference, { cascade: true })
  replays: Replay[];

  @JoinColumn({ name: 'room_uid', referencedColumnName: 'uid' })
  @ManyToOne(() => Room, (room) => room.conferences)
  room: Room;
}
