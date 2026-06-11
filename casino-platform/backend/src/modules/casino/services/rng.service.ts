import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class RngService {
  generateRandomResult(userId: string, gameType: string): { result: number; hash: string; seed: string } {
    const seed = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now().toString();
    const combined = `${seed}-${userId}-${gameType}-${timestamp}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');

    // Convertir hash a un número decimal entre 0 y 1
    const intResult = parseInt(hash.substring(0, 8), 16);
    const result = intResult / 0xffffffff;

    return { result, hash, seed };
  }

  // Utilidad para obtener un entero en un rango [min, max]
  getRandomInt(userId: string, gameType: string, min: number, max: number) {
    const { result, hash, seed } = this.generateRandomResult(userId, gameType);
    const scaled = Math.floor(result * (max - min + 1)) + min;
    return { value: scaled, hash, seed };
  }
}
