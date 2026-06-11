import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuinielasService } from './quinielas.service';
import { QuinielasController } from './quinielas.controller';
import { Quiniela } from './entities/quiniela.entity';
import { QuinielaTicket } from './entities/quiniela-ticket.entity';
import { WalletModule } from '../wallet/wallet.module';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiniela, QuinielaTicket]),
    WalletModule,
    ComplianceModule,
  ],
  providers: [QuinielasService],
  controllers: [QuinielasController],
})
export class QuinielasModule {}
