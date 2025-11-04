import {
  Entity, PrimaryGeneratedColumn, Column, Index, OneToMany, ManyToMany, JoinTable,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { Participant } from '../../participant/entities/participant.entity';
import { Conference } from '../../conference/entities/conference.entity';

export enum AuthProvider {
  LOCAL = 'LOCAL',
  OIDC = 'OIDC',
  LDAP = 'LDAP',
}

@Entity('users')
@Index('ix_users_email', ['email'], { unique: true })
@Index('ix_users_username', ['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // Identifiant public stable pour exposer en API/URL
  @Column({ unique: true })
  uid: string; // uuid v4 généré côté service

  // Postgres: vous pouvez remplacer par { type: 'citext', nullable: true }
  @Column({ nullable: true })
  email?: string | null;

  @Column({ nullable: true })
  username?: string | null;

  @Column({ name: 'display_name', length: 128 })
  displayName?: string;

  // Si LOCAL: hash enregistré. Si OIDC/SAML/LDAP: peut rester null
  @Column({ name: 'password_hash', nullable: true })
  passwordHash?: string | null;

  @Column({ name: 'phone', length: 32, nullable: true })
  phone?: string | null;


  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string | null;

  @Column({ name: 'role', type: 'varchar', length: 64, nullable: true })
  role?: string | null;

  // Indique si l'utilisateur est administrateur
  @Column({ name: 'admin', type: 'boolean', default: false })
  admin!: boolean;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.OIDC })
  provider!: AuthProvider;

  // ID externe pour relier à Keycloak/IdP (sub, subjectId, etc.)
  @Column({ name: 'external_id', nullable: true })
  externalId?: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  // Relations
  @OneToMany(() => Participant, p => p.user)
  participants!: Participant[];

  // Organisateurs de conférences 
  @ManyToMany(() => Conference, c => c.organizers, { cascade: false })
  @JoinTable({
    name: 'conference_organizers',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'conference_id', referencedColumnName: 'id' },
  })
  organizedConferences!: Conference[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
