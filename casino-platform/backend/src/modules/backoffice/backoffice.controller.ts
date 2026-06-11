import { Controller, Get, UseGuards } from '@nestjs/common';
import { BackofficeService } from './backoffice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('backoffice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Aquí debería haber un RolesGuard('admin')
@Controller('backoffice')
export class BackofficeController {
  constructor(private backofficeService: BackofficeService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas globales de la plataforma' })
  async getStats() {
    return this.backofficeService.getGlobalStats();
  }

  @Get('compliance/flagged')
  @ApiOperation({ summary: 'Listar usuarios para revisión de cumplimiento' })
  async getFlagged() {
    return this.backofficeService.getFlaggedUsers();
  }
}
