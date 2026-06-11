import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SportEvent } from './entities/sport-event.entity';
import { Bet } from './entities/bet.entity';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class SportsBettingService {
  constructor(
    @InjectRepository(SportEvent)
    private eventRepository: Repository<SportEvent>,
    @InjectRepository(Bet)
    private betRepository: Repository<Bet>,
    private walletService: WalletService,
  ) {}

  async createEvent(data: Partial<SportEvent>) {
    const event = this.eventRepository.create(data);
    return this.eventRepository.save(event);
  }

  async placeBet(userId: string, eventId: string, prediction: string, amount: number) {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event || event.status !== 'open') {
      throw new BadRequestException('El evento no está disponible para apuestas');
    }

    let odds = 0;
    if (prediction === 'A') odds = event.oddsA;
    else if (prediction === 'B') odds = event.oddsB;
    else if (prediction === 'Draw') odds = event.oddsDraw;
    else throw new BadRequestException('Predicción inválida');

    await this.walletService.processTransaction(userId, -amount, 'bet_placement', eventId);

    const bet = this.betRepository.create({
      user: { id: userId } as any,
      event,
      prediction,
      amount,
      oddsAtBet: odds,
    });

    return this.betRepository.save(bet);
  }

  // Soporte para combinadas (parlays) simplificado
  async placeParlay(userId: string, selections: { eventId: string, prediction: string }[], amount: number) {
      if (selections.length < 2) throw new BadRequestException('Se requieren al menos 2 selecciones para una combinada');

      let totalOdds = 1;
      const events: any[] = [];

      for (const sel of selections) {
          const event = await this.eventRepository.findOne({ where: { id: sel.eventId } });
          if (!event || event.status !== 'open') throw new BadRequestException(`Evento ${sel.eventId} no disponible`);

          let odds = 0;
          if (sel.prediction === 'A') odds = event.oddsA;
          else if (sel.prediction === 'B') odds = event.oddsB;
          else if (sel.prediction === 'Draw') odds = event.oddsDraw;

          totalOdds *= odds;
          events.push(event);
      }

      await this.walletService.processTransaction(userId, -amount, 'bet_placement_parlay');

      // En un sistema real crearíamos una entidad ParlayBet. Aquí simulamos el registro.
      return { status: 'pending', totalOdds, amount, potentialPayout: amount * totalOdds };
  }

  async settleEvent(eventId: string, result: string) {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) throw new Error('Evento no encontrado');

    event.result = result;
    event.status = 'settled';
    await this.eventRepository.save(event);

    const bets = await this.betRepository.find({
      where: { event: { id: eventId }, status: 'pending' },
      relations: { user: true }
    });

    for (const bet of bets) {
      if (bet.prediction === result) {
        bet.status = 'won';
        bet.payout = bet.amount * bet.oddsAtBet;
        await this.walletService.processTransaction(bet.user.id, bet.payout, 'bet_payout', bet.id);
      } else {
        bet.status = 'lost';
      }
      await this.betRepository.save(bet);
    }
  }

  async getActiveEvents() {
    return this.eventRepository.find({ where: { status: 'open' } });
  }
}
