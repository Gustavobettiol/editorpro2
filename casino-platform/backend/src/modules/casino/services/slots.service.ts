import { Injectable } from '@nestjs/common';
import { RngService } from './rng.service';
import { WalletService } from '../../wallet/wallet.service';

@Injectable()
export class SlotsService {
  private symbols = ['CHERRY', 'BAR', 'BELL', 'SEVEN'];
  private payouts = {
    'SEVEN-SEVEN-SEVEN': 50,
    'BELL-BELL-BELL': 20,
    'BAR-BAR-BAR': 10,
    'CHERRY-CHERRY-CHERRY': 5,
    'CHERRY-CHERRY-ANY': 2,
  };

  constructor(
    private rngService: RngService,
    private walletService: WalletService
  ) {}

  async spin(userId: string, betAmount: number) {
    // Deducir apuesta
    await this.walletService.processTransaction(userId, -betAmount, 'casino_loss', 'slots_spin');

    const reel1 = this.symbols[this.rngService.getRandomInt(userId, 'slots', 0, 3).value];
    const reel2 = this.symbols[this.rngService.getRandomInt(userId, 'slots', 0, 3).value];
    const reel3 = this.symbols[this.rngService.getRandomInt(userId, 'slots', 0, 3).value];

    const result = [reel1, reel2, reel3];
    const combination = result.join('-');

    let multiplier = 0;
    if (this.payouts[combination]) {
      multiplier = this.payouts[combination];
    } else if (reel1 === 'CHERRY' && reel2 === 'CHERRY') {
      multiplier = this.payouts['CHERRY-CHERRY-ANY'];
    }

    const winAmount = betAmount * multiplier;
    if (winAmount > 0) {
      await this.walletService.processTransaction(userId, winAmount, 'casino_win', 'slots_payout');
    }

    return {
      reels: result,
      winAmount,
      balance: (await this.walletService.getTransactions(userId))[0].amount // Simplificado
    };
  }
}
