// import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// @Entity('incidents')
// export class Incident {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ type: 'varchar', length: 255 })
//   twinId: string;

//   @Column({ type: 'varchar', length: 100 })
//   system: string;

//   @Column({ type: 'varchar', length: 50 })
//   labCode: string;

//   @Column({ type: 'decimal', precision: 10, scale: 2 })
//   labValue: number;

//   @Column({ type: 'varchar', length: 20 })
//   severity: string;


//   @Column({ type: 'text' })
//   payload: string;

//   @CreateDateColumn()
//   createdAt: Date;
// }

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  twinId: string;

  @Column({ type: 'varchar', length: 100, nullable: true }) // ✅ Nullable allows old rows to exist
  system: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  labCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  labValue: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  severity: string;

  @Column({ type: 'text', nullable: true })
  payload: string;

  @CreateDateColumn()
  createdAt: Date;
}