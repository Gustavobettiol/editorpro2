import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('sport_events')
export class SportEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sport: string;

  @Column()
  teamA: string;

  @Column()
  teamB: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  oddsA: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  oddsDraw: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  oddsB: number;

  @Column({ default: 'open' }) // open, closed, settled
  status: string;

  @Column({ nullable: true })
  result: string; // A, B, Draw

  @Column({ type: 'timestamp' })
  startTime: Date;

  @CreateDateColumn()
  createdAt: Date;
}
