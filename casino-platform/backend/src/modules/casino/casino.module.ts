import { Module } from '@nestjs/common';
import { CasinoController } from './casino.controller';
import { RngService } from './services/rng.service';
import { SlotsService } from './services/slots.service';
import { RouletteService } from './services/roulette.service';
import { BlackjackService } from './services/blackjack.service';
import { DiceService } from './services/dice.service';
import { WalletModule } from '../wallet/wallet.module';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [WalletModule, ComplianceModule],
  providers: [RngService, SlotsService, RouletteService, BlackjackService, DiceService],
  controllers: [CasinoController],
})
export class CasinoModule {}
