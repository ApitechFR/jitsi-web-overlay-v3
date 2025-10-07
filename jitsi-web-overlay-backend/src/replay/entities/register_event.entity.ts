import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('register_event')
export class RegisterEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  confname: string;

  @Column({ type: 'varchar' })
  eventid: string;

  @Column({ type: 'varchar' })
  jwt: string;

  @Column({ type: 'varchar' })
  uploadCallbackUrl: string;

  @Column({ type: 'varchar' })
  uploadCallbackDomainUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}