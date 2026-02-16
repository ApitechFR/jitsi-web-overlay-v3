import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { Client } from './client.entity';
import { ModuleKey } from '../enums/module-key.enum';


/**
 * Entity ClientModule - Modules enabled for a client
 * Acts as an intermediate between Client and available modules
 * On creation, inherited from the client's Offer
 */
@Entity('client_modules')
@Unique(['client', 'moduleKey'])
@Index(['clientId', 'enabled'])
export class ClientModule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Client, (client) => client.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column()
  clientId: number;

  @Column({ type: 'enum', enum: ModuleKey })
  moduleKey: ModuleKey;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'json', nullable: true, comment: 'Configuration specific per module' })
  config?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
