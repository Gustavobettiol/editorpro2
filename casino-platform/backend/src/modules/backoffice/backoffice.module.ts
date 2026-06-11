import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackofficeService } from './backoffice.service';
import { BackofficeController } from './backoffice.controller';
import { Transaction } from '../wallet/entities/transaction.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, User])],
  providers: [BackofficeService],
  controllers: [BackofficeController],
})
export class BackofficeModule {}
