import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ComplianceService } from '../compliance.service';

@Injectable()
export class ComplianceGuard implements CanActivate {
  constructor(private complianceService: ComplianceService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return true;

    const rules = this.complianceService.getRules();
    const jurisdiction = user.nationality || 'default';
    const rule = rules.jurisdictions[jurisdiction] || rules.default;

    if (!rule.allowed) {
      throw new ForbiddenException(rule.reason || 'Jurisdicción no permitida');
    }

    const birthDate = new Date(user.birthDate);
    const age = this.calculateAge(birthDate);
    if (age < rule.minAge) {
      throw new ForbiddenException(`Se requiere una edad mínima de ${rule.minAge} años`);
    }

    if (user.isAutoExcluded && (!user.autoExclusionUntil || new Date(user.autoExclusionUntil) > new Date())) {
      throw new ForbiddenException('El usuario se encuentra autoexcluido temporalmente');
    }

    return true;
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
