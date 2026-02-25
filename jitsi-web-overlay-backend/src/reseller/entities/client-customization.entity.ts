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

@Entity('client_customizations')
@Index(['client'], { unique: true }) // optionnel: 1 customization par client (si c’est bien ton intention)
export class ClientCustomization {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Client, (client) => client.customization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ type: 'text', nullable: true, comment: 'Primary logo (URL or base64)' })
  logo?: string;

  @Column({ name: 'logo_small', type: 'text', nullable: true, comment: 'Small logo' })
  logoSmall?: string;

  @Column({ name: 'logo_dark_mode', type: 'text', nullable: true, comment: 'Dark mode logo (URL or base64)' })
  logoDarkMode?: string;

  @Column({ type: 'text', nullable: true, comment: 'Favicon (URL or base64)' })
  favicon?: string;

  @Column({ name: 'app_name', type: 'varchar', length: 50, nullable: true, comment: 'Custom application name' })
  appName?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}