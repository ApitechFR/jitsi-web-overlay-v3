import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Client } from './client.entity';


/**
 * Entity ClientCustomization - Branding/personalization (logos, colors, etc.)
 * Only for PREMIUM clients
 * NULL if BASIC client
 */
@Entity('client_customizations')
export class ClientCustomization {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Client, (client) => client.customization)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ nullable: true, comment: 'Primary logo (URL or base64)' })
  logo?: string;

  @Column({ nullable: true, comment: 'Small logo' })
  logoSmall?: string;

  @Column({ nullable: true, comment: 'Dark mode logo (URL or base64)' })
  logoDarkMode?: string;

  @Column({ nullable: true, comment: 'Favicon (URL or base64)' })
  favicon?: string;

  @Column({ nullable: true, length: 50, comment: 'Custom application name' })
  appName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
