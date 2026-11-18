import { describe, expect, it } from 'vitest';
import { isNetworkFailure, ONLINE_POLL_MS, retryDelay, RETRY_DELAYS_MS, secondsUntil } from '@/features/connection';
import { ApiError } from '@/services/client';

describe('reconexão automática', () => {
  it('espera cada vez mais entre tentativas, até o limite de 30 s', () => {
    expect([0, 1, 2, 3, 4].map(retryDelay)).toEqual([2000, 4000, 8000, 15000, 30000]);
    expect(retryDelay(50)).toBe(30000);
    expect(retryDelay(-1)).toBe(2000);
    for (let attempt = 1; attempt < RETRY_DELAYS_MS.length; attempt++) expect(retryDelay(attempt)).toBeGreaterThan(retryDelay(attempt - 1));
  });
  it('nunca espera mais que o ciclo normal de atualização', () => {
    expect(Math.max(...RETRY_DELAYS_MS)).toBeLessThanOrEqual(ONLINE_POLL_MS);
  });
  it('só considera desconexão a falha de rede (status 0), não erros HTTP do servidor', () => {
    expect(isNetworkFailure(new ApiError('sem rede', 0))).toBe(true);
    expect(isNetworkFailure(new ApiError('erro interno', 500))).toBe(false);
    expect(isNetworkFailure(new ApiError('não encontrado', 404))).toBe(false);
    expect(isNetworkFailure(new Error('genérico'))).toBe(false);
    expect(isNetworkFailure(null)).toBe(false);
  });
  it('mostra a contagem regressiva até a próxima tentativa sem valores negativos', () => {
    expect(secondsUntil(10_500, 2_000)).toBe(9);
    expect(secondsUntil(1_000, 5_000)).toBe(0);
    expect(secondsUntil(null)).toBeNull();
  });
});
