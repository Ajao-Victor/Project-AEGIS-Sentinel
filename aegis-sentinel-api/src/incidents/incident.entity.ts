import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  twinId: string;

  @Column()
  triggeringSystem: string;

  @Column()
  labCode: string;

  @Column('float')
  labValue: number;

  @Column()
  severityLevel: string;

  @Column()
  totalInteractions: number;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}