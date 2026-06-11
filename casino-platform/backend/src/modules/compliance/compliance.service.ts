import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ComplianceService implements OnModuleInit {
  private rules: any;

  onModuleInit() {
    const rulesPath = path.resolve(__dirname, '../../../../compliance/rules.json');
    this.rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  }

  getRules() {
    return this.rules;
  }
}
