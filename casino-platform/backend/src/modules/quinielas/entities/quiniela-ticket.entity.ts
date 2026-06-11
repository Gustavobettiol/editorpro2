import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Quiniela } from './quiniela.entity';

@Entity('quiniela_tickets')
export class QuinielaTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Quiniela)
  quiniela: Quiniela;

  @Column({ type: 'json' })
  predictions: { [matchId: number]: string };

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  cost: number;

  @Column({ default: 'pending' }) // pending, won, lost
  status: string;

  @Column({ default: 0 })
  hits: number;

  @CreateDateColumn()
  createdAt: Date;
}
