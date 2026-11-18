import { describe, expect, it } from 'vitest';
import { getStartupFrame, STARTUP_DURATION_MS } from '@/features/startup-sequence';

describe('sequência institucional de sete segundos', () => {
  it.each([
    [0, 'Carregando mapa da cidade...'], [1999, 'Carregando mapa da cidade...'],
    [2000, 'Conectando sensores urbanos...'], [3999, 'Conectando sensores urbanos...'],
    [4000, 'Analisando riscos por bairro...'], [5999, 'Analisando riscos por bairro...'],
    [6000, 'Plataforma pronta.'], [7000, 'Plataforma pronta.'],
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
