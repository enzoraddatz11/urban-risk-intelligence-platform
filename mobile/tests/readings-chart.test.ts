import { describe, expect, it } from 'vitest';
import { chartGeometry, prepareReadings } from '@/features/readings-chart';
import type { EntityMap } from '@/types/api';

const reading = (id: number, sensorId: number, value: number, recordedAt: string): EntityMap['readings'] =>
  ({ id, sensorId, value, recordedAt, source: 'SENSOR', confidence: 90, confidenceLevel: 'ALTO' });

describe('Gráfico de leituras de um sensor', () => {
  it('não desenha uma série sem leituras', () => { expect(chartGeometry([])).toBeNull(); });
  it('mostra uma medição isolada sem criar outras amostras', () => {
    const result = chartGeometry([reading(1, 8, 46.5, '2026-01-01T00:00:00Z')]);
    expect(result?.points).toHaveLength(1); expect(result?.min).toBe(46.5); expect(result?.max).toBe(46.5);
    expect(result?.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
  });
  it('filtra por sensor e ordena por data sem misturar unidades', () => {
    const rows = prepareReadings([
      reading(1, 8, 61, '2026-01-02T00:00:00Z'), reading(2, 9, 999, '2026-01-01T00:00:00Z'), reading(3, 8, 12, '2026-01-01T00:00:00Z'),
    ], 8);
    expect(rows.map(row => row.id)).toEqual([3, 1]);
    const chart = chartGeometry(rows);
    expect(chart?.latest.value).toBe(61); expect(chart?.min).toBe(12); expect(chart?.max).toBe(61);
    expect(chart?.points[0].x).toBeLessThan(chart!.points[1].x);
  });
  it('mantém coordenadas finitas para datas e valores iguais', () => {
    const rows = [1, 2].map(id => reading(id, 1, 0, '2026-01-01T00:00:00Z'));
    expect(chartGeometry(rows)?.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
  });
});
