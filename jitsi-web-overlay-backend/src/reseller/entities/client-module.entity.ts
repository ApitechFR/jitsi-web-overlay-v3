import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Client } from './client.entity';
import { ModuleKey } from '../enums/module-key.enum';

@Entity('client_modules')
@Unique(['client', 'moduleKey'])
@Index(['client', 'enabled'])
export class ClientModule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'client_id', type: 'int' })
  clientId: number;

  @ManyToOne(() => Client, (client) => client.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'module_key', type: 'enum', enum: ModuleKey })
  moduleKey: ModuleKey;

  @Column({ name: 'enabled', type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'json', nullable: true, comment: 'Configuration specific per module' })
  config?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}