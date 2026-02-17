import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 *  Entity ApiKey - Unique API key for authentication
 * 
 * PBKDF2 hashing with constant-time validation
 * The actual key is NEVER stored
 */
@Entity('api_key')
export class ApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 255,
    comment: 'PBKDF2 hash of the API key - for constant-time validation',
  })
  keyHash: string;

  @CreateDateColumn()
  createdAt: Date;
}
