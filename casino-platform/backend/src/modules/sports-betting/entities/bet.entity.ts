import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { SportEvent } from './sport-event.entity';

@Entity('bets')
export class Bet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => SportEvent)
  event: SportEvent;

  @Column()
  prediction: string; // A, B, Draw

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  oddsAtBet: number;

  @Column({ default: 'pending' }) // pending, won, lost
  status: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  payout: number;

  @CreateDateColumn()
  createdAt: Date;
}
