import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from './client.entity';


/**
 * Entity ClientDomain - Authorized email domains for a client
 * Uniqueness: a domain can only belong to one client
 * Used for filtering users or pre-filling LDAP domains
 */
@Entity('client_domains')
export class ClientDomain {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Client, (client) => client.domains, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'domain_name', type: 'varchar', length: 255, unique: true })
  domainName: string; // e.g., "apitech.fr"

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
