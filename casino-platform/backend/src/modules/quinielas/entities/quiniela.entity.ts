import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('quinielas')
export class Quiniela {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'json' })
  matches: { id: number; home: string; away: string }[];

  @Column({ default: 'open' }) // open, closed, settled
  status: string;

  @Column({ type: 'json', nullable: true })
  results: { [matchId: number]: string }; // 1, X, 2

  @Column({ type: 'timestamp' })
  closingTime: Date;

  @CreateDateColumn()
  createdAt: Date;
}
