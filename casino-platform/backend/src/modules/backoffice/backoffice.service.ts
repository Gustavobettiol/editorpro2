import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../wallet/entities/transaction.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class BackofficeService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getGlobalStats() {
    const totalTransactions = await this.transactionRepository.count();
    const deposits = await this.transactionRepository.createQueryBuilder("transaction")
        .select("SUM(transaction.amount)", "sum")
        .where("transaction.type = :type", { type: 'deposit' })
        .getRawOne();

    const activeUsers = await this.userRepository.count();

    return {
      totalTransactions,
      volumeDeposits: Number(deposits?.sum) || 0,
      activeUsers,
    };
  }

  async getFlaggedUsers() {
    return this.userRepository.find({
        where: { kycStatus: 'pending' },
        take: 10
    });
  }
}
