import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Client } from './client.entity';


/**
 * Entity ClientAuthConfig - Per-client authentication configuration
 * Supports OIDC
 * Secrets are encrypted via EncryptionService
 */
@Entity('client_auth_configs')
export class ClientAuthConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Client, (client) => client.authConfig)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column()
  clientId: number;

  @Column({ type: 'enum', enum: ['oidc', 'ldap', 'local'] })
  type: 'oidc' | 'ldap' | 'local';

  @Column({
    type: 'json',
    comment: 'Encrypted config - contains URL, clientId, clientSecret, etc.',
  })
  config: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
