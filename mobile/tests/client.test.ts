import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from '../src/services/client';

afterEach(() => vi.useRealTimers());
describe('Cliente REST', () => {
  it('faz GET paginado com Accept JSON', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ content: [], totalElements: 0 }));
    await createApiClient('http://example.test/api/', fetcher).list('sensors', 2, 20);
    expect(fetcher).toHaveBeenCalledWith('http://example.test/api/sensors?page=2&size=20', expect.objectContaining({
      method: 'GET', headers: { Accept: 'application/json' },
    }));
  });
  it('envia POST com corpo JSON e retorna o ID real da resposta', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ id: 9 }, { status: 201 }));
    const payload = { name: 'Módulo', description: 'Bordo', status: 'OPERATIONAL' as const };
    const result = await createApiClient('http://example.test/api', fetcher).create('modules', payload);
    expect(result.id).toBe(9);
    expect(fetcher).toHaveBeenCalledWith('http://example.test/api/modules', expect.objectContaining({
      method: 'POST', body: JSON.stringify(payload), headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    }));
  });
  it('preserva mensagens e erros por campo retornados pelo backend', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ message: 'Dados inválidos', errors: { name: 'Obrigatório' } }, { status: 400 }));
    await expect(createApiClient('http://example.test/api', fetcher).missionStatus()).rejects.toMatchObject({
      status: 400, message: 'Dados inválidos', fields: { name: 'Obrigatório' },
    });
  });
  it('não substitui falha de rede por dados fictícios', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline'));
    await expect(createApiClient('http://example.test/api', fetcher).missionStatus()).rejects.toBeInstanceOf(ApiError);
  });
  it('não reenvia POST em caso de falha de conexão', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline'));
    const client = createApiClient('http://example.test/api', fetcher);
    await expect(client.create('modules', { name: 'Teste', description: 'Teste', status: 'OPERATIONAL' })).rejects.toThrow('Atualize a lista');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('interrompe uma requisição que excede o timeout', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('abort')));
    }));
    const assertion = expect(createApiClient('http://example.test/api', fetcher, 50).missionStatus()).rejects.toMatchObject({ status: 0 });
    await vi.advanceTimersByTimeAsync(51);
    await assertion;
  });
  it('trata resposta que não é JSON', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('Bad gateway', { status: 502 }));
    await expect(createApiClient('http://example.test/api', fetcher).missionStatus()).rejects.toThrow('não é JSON');
  });
  it('carrega todas as páginas das relações, inclusive além de 100 registros', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ content: [{ id: 101 }], totalPages: 2 }))
      .mockResolvedValueOnce(Response.json({ content: [{ id: 1 }], totalPages: 2 }));
    const rows = await createApiClient('http://example.test/api', fetcher).all('modules');
    expect(rows.map(row => row.id)).toEqual([101, 1]);
    expect(fetcher).toHaveBeenNthCalledWith(2, 'http://example.test/api/modules?page=1&size=100', expect.anything());
  });
});

it('consulta telemetria de um único sensor com amostra limitada', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ content: [], totalElements: 0 }));
  await createApiClient('http://example.test/api', fetcher).readingsForSensor(7);
  expect(fetcher).toHaveBeenCalledWith('http://example.test/api/readings?sensorId=7&page=0&size=24', expect.objectContaining({ method: 'GET' }));
});