import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { SportsBettingService } from './sports-betting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ComplianceGuard } from '../compliance/guards/compliance.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('sports-betting')
@Controller('sports-betting')
export class SportsBettingController {
  constructor(private sportsService: SportsBettingService) {}

  @Get('events')
  @ApiOperation({ summary: 'Listar eventos deportivos activos' })
  async getEvents() {
    return this.sportsService.getActiveEvents();
  }

  @Post('bet')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ComplianceGuard)
  @ApiOperation({ summary: 'Realizar una apuesta simple' })
  async placeBet(@Req() req, @Body() body: { eventId: string, prediction: string, amount: number }) {
    return this.sportsService.placeBet(req.user.id, body.eventId, body.prediction, body.amount);
  }

  @Post('parlay')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ComplianceGuard)
  @ApiOperation({ summary: 'Realizar una apuesta combinada (parlay)' })
  async placeParlay(@Req() req, @Body() body: { selections: any[], amount: number }) {
    return this.sportsService.placeParlay(req.user.id, body.selections, body.amount);
  }
}
