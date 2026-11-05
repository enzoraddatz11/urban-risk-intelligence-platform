import { describe, expect, it } from 'vitest';
import { chartGeometry, componentHealth, prepareReadings } from '@/features/mission-metrics';
import type { MissionStatus } from '@/types/api';
const mission: MissionStatus = { status: 'WARNING', checkedAt: '2026-01-01T00:00:00Z', modules: 3, sensors: 5, systems: 2, readings: 0, events: 0, activeCriticalAlerts: 0, degradedComponents: 2, offlineComponents: 1 };
describe('Indicadores baseados nos dados da missão', () => {
  it('calcula a distribuição usando módulos, sensores e sistemas', () => {
    expect(componentHealth(mission)).toEqual({ total: 10, operational: 7, degraded: 2, offline: 1, percentage: 70 });
  });
  it('não inventa porcentagem com inventário vazio', () => {
    expect(componentHealth({ ...mission, modules: 0, sensors: 0, systems: 0, degradedComponents: 0, offlineComponents: 0 }).percentage).toBeNull();
  });
  it('não desenha uma série sem leituras', () => { expect(chartGeometry([])).toBeNull(); });
  it('mostra uma medição isolada sem criar outras amostras', () => {
    const result = chartGeometry([{ id: 1, sensorId: 8, value: -12.5, recordedAt: '2026-01-01T00:00:00Z' }]);
    expect(result?.points).toHaveLength(1); expect(result?.min).toBe(-12.5); expect(result?.max).toBe(-12.5);
    expect(result?.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
  });
  it('filtra por sensor e ordena por data sem misturar unidades', () => {
    const rows = prepareReadings([
      { id: 1, sensorId: 8, value: 10, recordedAt: '2026-01-02T00:00:00Z' },
      { id: 2, sensorId: 9, value: 999, recordedAt: '2026-01-01T00:00:00Z' },
      { id: 3, sensorId: 8, value: -2, recordedAt: '2026-01-01T00:00:00Z' },
    ], 8);
    expect(rows.map(row => row.id)).toEqual([3, 1]);
    const chart = chartGeometry(rows);
    expect(chart?.latest.value).toBe(10); expect(chart?.min).toBe(-2); expect(chart?.max).toBe(10);
    expect(chart?.points[0].x).toBeLessThan(chart!.points[1].x);
  });
  it('mantém coordenadas finitas para datas e valores iguais', () => {
    const rows = [1,2].map(id => ({ id, sensorId: 1, value: 0, recordedAt: '2026-01-01T00:00:00Z' }));
    expect(chartGeometry(rows)?.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
  });
});
