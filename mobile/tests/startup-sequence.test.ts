import { describe, expect, it } from 'vitest';
import { getStartupFrame, STARTUP_DURATION_MS } from '@/features/startup-sequence';

describe('sequência institucional de sete segundos', () => {
  it.each([
    [0, 'Inicializando sistemas...'], [1999, 'Inicializando sistemas...'],
    [2000, 'Conectando telemetria...'], [3999, 'Conectando telemetria...'],
    [4000, 'Verificando módulos da missão...'], [5999, 'Verificando módulos da missão...'],
    [6000, 'Missão pronta.'], [7000, 'Missão pronta.'],
  ])('seleciona a mensagem no instante %i ms', (elapsed, message) => {
    expect(getStartupFrame(elapsed).message).toBe(message);
  });
  it('mantém o progresso limitado e crescente, inclusive após atrasos nos timers', () => {
    expect(getStartupFrame(-100).percent).toBe(0);
    expect(getStartupFrame(STARTUP_DURATION_MS / 2).percent).toBe(50);
    expect(getStartupFrame(STARTUP_DURATION_MS).percent).toBe(100);
    expect(getStartupFrame(30000).percent).toBe(100);
    let previous = 0;
    for (let elapsed = 0; elapsed <= 8000; elapsed += 137) {
      const { percent } = getStartupFrame(elapsed);
      expect(percent).toBeGreaterThanOrEqual(previous);
      expect(percent).toBeLessThanOrEqual(100);
      previous = percent;
    }
  });
});
