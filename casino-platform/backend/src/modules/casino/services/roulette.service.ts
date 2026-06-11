import { Injectable } from '@nestjs/common';
import { RngService } from './rng.service';
import { WalletService } from '../../wallet/wallet.service';

@Injectable()
export class RouletteService {
  constructor(
    private rngService: RngService,
    private walletService: WalletService
  ) {}

  async play(userId: string, betAmount: number, betType: string, betValue: string) {
    await this.walletService.processTransaction(userId, -betAmount, 'casino_loss', 'roulette_bet');

    const { value: winningNumber } = this.rngService.getRandomInt(userId, 'roulette', 0, 36);

    let isWin = false;
    let multiplier = 0;

    if (betType === 'number' && parseInt(betValue) === winningNumber) {
      isWin = true;
      multiplier = 36;
    } else if (betType === 'color') {
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      const color = redNumbers.includes(winningNumber) ? 'red' : winningNumber === 0 ? 'green' : 'black';
      if (betValue === color) {
        isWin = true;
        multiplier = 2;
      }
    } else if (betType === 'parity') {
        if (winningNumber !== 0) {
            const parity = winningNumber % 2 === 0 ? 'even' : 'odd';
            if (betValue === parity) {
                isWin = true;
                multiplier = 2;
            }
        }
    }

    const winAmount = isWin ? betAmount * multiplier : 0;
    if (winAmount > 0) {
      await this.walletService.processTransaction(userId, winAmount, 'casino_win', 'roulette_payout');
    }

    return {
      winningNumber,
      winAmount,
      isWin
    };
  }
}
