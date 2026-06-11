import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SportsBettingService } from './sports-betting.service';
import { SportsBettingController } from './sports-betting.controller';
import { SportsBettingGateway } from './sports-betting.gateway';
import { SportEvent } from './entities/sport-event.entity';
import { Bet } from './entities/bet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SportEvent, Bet]),
    WalletModule,
    ComplianceModule,
  ],
  providers: [SportsBettingService, SportsBettingGateway],
  controllers: [SportsBettingController],
})
export class SportsBettingModule {}
