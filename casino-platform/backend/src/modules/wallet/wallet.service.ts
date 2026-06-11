import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  async processTransaction(userId: string, amount: number, type: string, referenceId?: string): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, { where: { id: userId }, lock: { mode: 'pessimistic_write' } });

      if (!user) throw new Error('Usuario no encontrado');

      const newBalance = Number(user.balance) + amount;
      if (newBalance < 0) {
        throw new BadRequestException('Saldo insuficiente');
      }

      user.balance = newBalance;
      await queryRunner.manager.save(user);

      const transaction = this.transactionRepository.create({
        user,
        amount,
        type,
        referenceId,
      });
      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return savedTransaction;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }
}
