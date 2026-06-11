import { Injectable } from '@nestjs/common';
import { RngService } from './rng.service';
import { WalletService } from '../../wallet/wallet.service';

@Injectable()
export class DiceService {
  constructor(
    private rngService: RngService,
    private walletService: WalletService
  ) {}

  async roll(userId: string, betAmount: number, target: number, condition: 'over' | 'under') {
    await this.walletService.processTransaction(userId, -betAmount, 'casino_loss', 'dice_bet');

    const roll = this.rngService.getRandomInt(userId, 'dice', 1, 100).value;
    let isWin = false;

    if (condition === 'over' && roll > target) isWin = true;
    if (condition === 'under' && roll < target) isWin = true;

    // Multiplicador dinámico simplificado: 95 / probabilidad
    const winProb = condition === 'over' ? (100 - target) : target;
    const multiplier = winProb > 0 ? 95 / winProb : 0;

    const winAmount = isWin ? betAmount * multiplier : 0;

    if (winAmount > 0) {
      await this.walletService.processTransaction(userId, winAmount, 'casino_win', 'dice_payout');
    }

    return { roll, isWin, winAmount, multiplier };
  }
}
