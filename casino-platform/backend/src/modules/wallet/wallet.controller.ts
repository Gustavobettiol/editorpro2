import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Post('deposit')
  @ApiOperation({ summary: 'Depositar fondos' })
  async deposit(@Req() req, @Body() body: { amount: number }) {
    return this.walletService.processTransaction(req.user.id, body.amount, 'deposit');
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Retirar fondos' })
  async withdraw(@Req() req, @Body() body: { amount: number }) {
    return this.walletService.processTransaction(req.user.id, -body.amount, 'withdrawal');
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Obtener historial de transacciones' })
  async getTransactions(@Req() req) {
    return this.walletService.getTransactions(req.user.id);
  }
}
