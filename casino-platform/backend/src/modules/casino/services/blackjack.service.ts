import { Injectable } from '@nestjs/common';
import { RngService } from './rng.service';
import { WalletService } from '../../wallet/wallet.service';

@Injectable()
export class BlackjackService {
  constructor(
    private rngService: RngService,
    private walletService: WalletService
  ) {}

  async play(userId: string, betAmount: number) {
    await this.walletService.processTransaction(userId, -betAmount, 'casino_loss', 'blackjack_bet');

    const deck = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const drawCard = () => deck[this.rngService.getRandomInt(userId, 'blackjack', 0, 12).value];

    const playerHand = [drawCard(), drawCard()];
    const dealerHand = [drawCard(), drawCard()];

    const calculateScore = (hand: string[]) => {
      let score = 0;
      let aces = 0;
      for (const card of hand) {
        if (card === 'A') aces++;
        else if (['J', 'Q', 'K'].includes(card)) score += 10;
        else score += parseInt(card);
      }
      for (let i = 0; i < aces; i++) {
        if (score + 11 <= 21) score += 11;
        else score += 1;
      }
      return score;
    };

    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(dealerHand);

    let result = 'lose';
    let winAmount = 0;

    if (playerScore > 21) {
      result = 'bust';
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      result = 'win';
      winAmount = betAmount * 2;
    } else if (playerScore === dealerScore) {
      result = 'push';
      winAmount = betAmount;
    }

    if (winAmount > 0) {
      await this.walletService.processTransaction(userId, winAmount, 'casino_win', 'blackjack_payout');
    }

    return { playerHand, dealerHand, playerScore, dealerScore, result, winAmount };
  }
}
