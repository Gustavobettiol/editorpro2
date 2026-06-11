import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findOneByEmail(email);
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, nationality: user.nationality, birthDate: user.birthDate, isAutoExcluded: user.isAutoExcluded };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          balance: user.balance
      }
    };
  }
}
