import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Client } from './client.entity';

@Entity('client_auth_configs')
@Index(['client'], { unique: true }) // 1 config auth par client (si c’est bien le modèle)
export class ClientAuthConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Client, (client) => client.authConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type?: 'oidc';

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Encrypted config - contains URL, clientId, clientSecret, etc.',
  })
  config?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}