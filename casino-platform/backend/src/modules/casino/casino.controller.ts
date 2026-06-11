import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SlotsService } from './services/slots.service';
import { RouletteService } from './services/roulette.service';
import { BlackjackService } from './services/blackjack.service';
import { DiceService } from './services/dice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ComplianceGuard } from '../compliance/guards/compliance.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('casino')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ComplianceGuard)
@Controller('casino')
export class CasinoController {
  constructor(
    private slotsService: SlotsService,
    private rouletteService: RouletteService,
    private blackjackService: BlackjackService,
    private diceService: DiceService
  ) {}

  @Post('slots/spin')
  @ApiOperation({ summary: 'Girar tragamonedas' })
  async spinSlots(@Req() req, @Body() body: { betAmount: number }) {
    return this.slotsService.spin(req.user.id, body.betAmount);
  }

  @Post('roulette/play')
  @ApiOperation({ summary: 'Apostar en la ruleta' })
  async playRoulette(@Req() req, @Body() body: { betAmount: number, betType: string, betValue: string }) {
    return this.rouletteService.play(req.user.id, body.betAmount, body.betType, body.betValue);
  }

  @Post('blackjack/play')
  @ApiOperation({ summary: 'Jugar una mano de Blackjack' })
  async playBlackjack(@Req() req, @Body() body: { betAmount: number }) {
    return this.blackjackService.play(req.user.id, body.betAmount);
  }

  @Post('dice/roll')
  @ApiOperation({ summary: 'Lanzar dados' })
  async rollDice(@Req() req, @Body() body: { betAmount: number, target: number, condition: 'over' | 'under' }) {
    return this.diceService.roll(req.user.id, body.betAmount, body.target, body.condition);
  }
}
