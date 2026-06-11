import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const salt = await bcrypt.genSalt();
    const password = userData.passwordHash || '';
    const passwordHash = await bcrypt.hash(password, salt);
    const user = this.userRepository.create({
      ...userData,
      passwordHash,
    });
    return this.userRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateBalance(id: string, amount: number): Promise<void> {
    await this.userRepository.increment({ id }, 'balance', amount);
  }
}
