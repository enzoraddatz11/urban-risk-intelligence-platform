import { describe, expect, it, vi } from 'vitest';
import { loadRelatedRecords, relatedRecord, relationFallback, relationTarget } from '@/features/related-records';
import { createApiClient } from '@/services/client';

describe('nomes e unidades dos relacionamentos', () => {
  it('resolve cada recurso para sua coleção de referência real', () => {
    expect(relationTarget('modules')).toBeUndefined();
    expect(relationTarget('sensors')).toBe('modules');
    expect(relationTarget('systems')).toBe('modules');
    expect(relationTarget('readings')).toBe('sensors');
    expect(relationTarget('events')).toBe('systems');
    expect(relationTarget('alerts')).toBe('systems');
  });
  it('carrega todas as páginas uma vez para compartilhar os nomes e as unidades entre cartões', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ content: [{ id: 12, name: 'Sensor térmico externo', type: 'TEMPERATURE', unit: 'C', status: 'OPERATIONAL', moduleId: 4 }], totalPages: 2 }))
      .mockResolvedValueOnce(Response.json({ content: [{ id: 13, name: 'Pressão da cabine', type: 'PRESSURE', unit: 'kPa', status: 'OPERATIONAL', moduleId: 4 }], totalPages: 2 }));
    const index = await loadRelatedRecords('readings', createApiClient('http://example.test/api', fetcher));
    expect(index.size).toBe(2);
    expect(relatedRecord({ id: 9, sensorId: 12, value: -12.5, recordedAt: '2026-01-01T00:00:00Z' }, 'readings', index)).toMatchObject({ name: 'Sensor térmico externo', unit: 'C' });
    expect(relatedRecord({ id: 10, sensorId: 13, value: 88.9, recordedAt: '2026-01-01T00:00:00Z' }, 'readings', index)).toMatchObject({ name: 'Pressão da cabine', unit: 'kPa' });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][0]).toBe('http://example.test/api/sensors?page=1&size=100');
  });
  it('não faz consultas extras para módulos e não inventa nomes ou unidades se a relação estiver ausente', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const index = await loadRelatedRecords('modules', createApiClient('http://example.test/api', fetcher));
    expect(fetcher).not.toHaveBeenCalled();
    expect(relatedRecord({ id: 9, sensorId: 12, value: -12.5, recordedAt: '2026-01-01T00:00:00Z' }, 'readings', index)).toBeUndefined();
    expect(relationFallback('sensors', 12)).toBe('Sensor #12');
    expect(relationFallback('modules', 3)).toBe('Módulo #3');
  });
  it('propaga falha da API para permitir erro e nova consulta, em vez de substituir os dados', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
    await expect(loadRelatedRecords('events', createApiClient('http://example.test/api', fetcher))).rejects.toThrow('Não foi possível acessar a API');
  });
});
