import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { QuinielasService } from './quinielas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ComplianceGuard } from '../compliance/guards/compliance.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('quinielas')
@Controller('quinielas')
export class QuinielasController {
  constructor(private quinielasService: QuinielasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar quinielas activas' })
  async getQuinielas() {
    return this.quinielasService.getActiveQuinielas();
  }

  @Post('buy')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ComplianceGuard)
  @ApiOperation({ summary: 'Comprar ticket de quiniela' })
  async buyTicket(@Req() req, @Body() body: any) {
    return this.quinielasService.buyTicket(req.user.id, body.quinielaId, body.predictions, body.cost);
  }
}
