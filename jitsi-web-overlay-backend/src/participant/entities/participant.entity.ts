import { Conference } from '../../conference/entities/conference.entity';
import { User } from '../../users/entities/users.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Conference, (conference) => conference.participants)
  @JoinColumn({ name: 'conference_id' })
  conference: Conference;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
