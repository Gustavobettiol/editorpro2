import { RngService } from './rng.service';

describe('RngService', () => {
  let service: RngService;

  beforeEach(() => {
    service = new RngService();
  });

  it('debe generar un resultado entre 0 y 1', () => {
    const { result } = service.generateRandomResult('user1', 'slots');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1);
  });

  it('getRandomInt debe retornar un valor dentro del rango', () => {
    const { value } = service.getRandomInt('user1', 'roulette', 0, 36);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(36);
  });
});
