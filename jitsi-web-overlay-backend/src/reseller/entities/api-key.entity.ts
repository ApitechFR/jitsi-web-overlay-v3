import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 *  Entity ApiKey - Unique API key for authentication
 * 
 * PBKDF2 hashing with constant-time validation
 * The actual key is NEVER stored
 */

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'PBKDF2 hash of the API key - for constant-time validation',
  })
  keyHash: string;

  @Column({
    name: 'key_hash_short',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: 'First 8 chars of the key hash for display purposes',
  })
  keyHashShort?: string;

  @CreateDateColumn()
  createdAt: Date;
}