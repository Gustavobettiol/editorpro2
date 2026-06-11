import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column()
  type: string; // deposit, withdrawal, bet_placement, bet_payout, casino_win, casino_loss

  @Column({ nullable: true })
  referenceId: string; // external ref or game session id

  @Column({ default: 'success' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
