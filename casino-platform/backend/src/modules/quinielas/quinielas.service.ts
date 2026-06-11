import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiniela } from './entities/quiniela.entity';
import { QuinielaTicket } from './entities/quiniela-ticket.entity';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class QuinielasService {
  constructor(
    @InjectRepository(Quiniela)
    private quinielaRepository: Repository<Quiniela>,
    @InjectRepository(QuinielaTicket)
    private ticketRepository: Repository<QuinielaTicket>,
    private walletService: WalletService,
  ) {}

  async createQuiniela(data: Partial<Quiniela>) {
    const q = this.quinielaRepository.create(data);
    return this.quinielaRepository.save(q);
  }

  async buyTicket(userId: string, quinielaId: string, predictions: any, cost: number) {
    const q = await this.quinielaRepository.findOne({ where: { id: quinielaId } });
    if (!q || q.status !== 'open') throw new BadRequestException('Quiniela no disponible');

    await this.walletService.processTransaction(userId, -cost, 'quiniela_bet', quinielaId);

    const ticket = this.ticketRepository.create({
      user: { id: userId } as any,
      quiniela: q,
      predictions,
      cost,
    });
    return this.ticketRepository.save(ticket);
  }

  async getActiveQuinielas() {
    return this.quinielaRepository.find({ where: { status: 'open' } });
  }
}
