import type { EntityMap, MissionStatus } from '@/types/api';
export function componentHealth(mission: MissionStatus) {
  const total = mission.modules + mission.sensors + mission.systems;
  const operational = Math.max(0, total - mission.offlineComponents - mission.degradedComponents);
  return { total, operational, degraded: mission.degradedComponents, offline: mission.offlineComponents,
    percentage: total > 0 ? Math.round(100 * operational / total) : null };
}
export function prepareReadings(readings: EntityMap['readings'][], sensorId: number) {
  return readings.filter(reading => reading.sensorId === sensorId && Number.isFinite(reading.value) && Number.isFinite(Date.parse(reading.recordedAt)))
    .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt) || a.id - b.id);
}
export function chartGeometry(readings: EntityMap['readings'][]) {
  if (!readings.length) return null;
  const values = readings.map(reading => reading.value);
  const min = Math.min(...values), max = Math.max(...values);
  const yRange = max - min || Math.max(1, Math.abs(max) * 0.05);
  const times = readings.map(reading => Date.parse(reading.recordedAt));
  const first = Math.min(...times), last = Math.max(...times);
  const points = readings.map((reading, index) => ({
    x: last === first ? 160 : 12 + (times[index] - first) / (last - first) * 296,
    y: min === max ? 72 : 124 - (reading.value - min) / yRange * 104,
  }));
  return { min, max, latest: readings[readings.length - 1], points, line: points.map(point => point.x + ',' + point.y).join(' ') };
}
