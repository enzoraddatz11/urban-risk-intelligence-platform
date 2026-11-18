import { describe, expect, it, vi } from 'vitest';
import { loadRelatedRecords, relatedRecord, relationFallback, relationTarget } from '@/features/related-records';
import { createApiClient } from '@/services/client';
import type { EntityMap } from '@/types/api';

const reading = (id: number, sensorId: number): EntityMap['readings'] =>
  ({ id, sensorId, value: 12.5, recordedAt: '2026-01-01T00:00:00Z', source: 'SENSOR', confidence: 90, confidenceLevel: 'ALTO' });
const sensor = (id: number, name: string, unit: string) =>
  ({ id, name, type: 'PLUVIOMETRO', unit, status: 'OPERANTE', regionId: 4, source: 'SENSOR', confidence: 90, confidenceLevel: 'ALTO' });

describe('nomes e unidades dos relacionamentos', () => {
  it('resolve cada recurso para sua coleção de referência real', () => {
    expect(relationTarget('regions')).toBeUndefined();
    expect(relationTarget('sensors')).toBe('regions');
    expect(relationTarget('readings')).toBe('sensors');
    expect(relationTarget('events')).toBe('regions');
    expect(relationTarget('reports')).toBe('regions');
  });
  it('carrega todas as páginas uma vez para compartilhar nomes e unidades entre cartões', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ content: [sensor(12, 'Pluviômetro da Várzea', 'mm/h')], totalPages: 2 }))
      .mockResolvedValueOnce(Response.json({ content: [sensor(13, 'Régua do Ribeirão', 'm')], totalPages: 2 }));
    const index = await loadRelatedRecords('readings', createApiClient('http://example.test/api', fetcher));
    expect(index.size).toBe(2);
    expect(relatedRecord(reading(9, 12), 'readings', index)).toMatchObject({ name: 'Pluviômetro da Várzea', unit: 'mm/h' });
    expect(relatedRecord(reading(10, 13), 'readings', index)).toMatchObject({ name: 'Régua do Ribeirão', unit: 'm' });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][0]).toBe('http://example.test/api/sensors?page=1&size=100');
  });
  it('não faz consultas extras para bairros e não inventa nomes se a relação estiver ausente', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const index = await loadRelatedRecords('regions', createApiClient('http://example.test/api', fetcher));
    expect(fetcher).not.toHaveBeenCalled();
    expect(relatedRecord(reading(9, 12), 'readings', index)).toBeUndefined();
    expect(relationFallback('sensors', 12)).toBe('Sensor #12');
    expect(relationFallback('regions', 3)).toBe('Bairro #3');
  });
  it('propaga falha da API para permitir erro e nova consulta, em vez de substituir os dados', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
    await expect(loadRelatedRecords('events', createApiClient('http://example.test/api', fetcher))).rejects.toThrow('Não foi possível acessar a API');
  });
});
