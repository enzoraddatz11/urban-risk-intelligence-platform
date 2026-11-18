import { describe, expect, it } from 'vitest';
import { isNotifiable, newNotifiableAlerts, notificationText, sensorHealth, severityColorKey } from '@/features/alerts';
import type { CityStatus, PrioritizedAlert, Severity } from '@/types/api';

const alert = (eventId: number, priority: Severity, score: number, regionName = 'Várzea do Ribeirão'): PrioritizedAlert => ({
  eventId, title: 'Evento ' + eventId, description: '', riskType: 'ALAGAMENTO', severity: priority, regionId: 1, regionName,
  source: 'SENSOR', confidence: 90, confidenceLevel: 'ALTO', communityReports: 0, lastReadingAt: null,
  occurredAt: '2026-01-01T00:00:00Z', score, priority, factors: { severity: 0, confidence: 0, corroboration: 0, freshness: 0 },
});

describe('notificações de alerta', () => {
  it('notifica apenas prioridades alta e crítica', () => {
    expect(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'].map(priority => isNotifiable(alert(1, priority as Severity, 50)))).toEqual([false, false, true, true]);
  });
  it('não repete alertas já notificados e ordena pelo score', () => {
    const alerts = [alert(1, 'ALTA', 60), alert(2, 'CRITICA', 90), alert(3, 'MEDIA', 45), alert(4, 'ALTA', 70)];
    expect(newNotifiableAlerts(alerts, new Set()).map(a => a.eventId)).toEqual([2, 4, 1]);
    expect(newNotifiableAlerts(alerts, new Set([2, 4])).map(a => a.eventId)).toEqual([1]);
    expect(newNotifiableAlerts(alerts, new Set([1, 2, 4]))).toEqual([]);
  });
  it('resume um ou vários alertas no texto da notificação', () => {
    expect(notificationText([])).toBeNull();
    expect(notificationText([alert(2, 'CRITICA', 90)])).toEqual({ title: 'Alerta crítico em Várzea do Ribeirão', body: 'Evento 2' });
    expect(notificationText([alert(2, 'CRITICA', 90), alert(4, 'ALTA', 70)])).toEqual({ title: '2 novos alertas prioritários', body: 'Evento 2 · e mais 1' });
  });
});

describe('indicadores do painel', () => {
  const status: CityStatus = { status: 'ATENCAO', checkedAt: '2026-01-01T00:00:00Z', regions: 5, sensors: 6, readings: 24, events: 6,
    activeEvents: 5, reports: 10, offlineSensors: 1, unstableSensors: 1, criticalAlerts: 0, highAlerts: 2 };
  it('calcula a situação da rede de sensores', () => {
    expect(sensorHealth(status)).toEqual({ total: 6, operational: 4, unstable: 1, offline: 1, percentage: 67 });
  });
  it('não inventa porcentagem sem sensores', () => {
    expect(sensorHealth({ ...status, sensors: 0, offlineSensors: 0, unstableSensors: 0 }).percentage).toBeNull();
  });
  it('usa cores coerentes com a gravidade', () => {
    expect(severityColorKey('CRITICA')).toBe('red');
    expect(severityColorKey('ALTA')).toBe('orange');
    expect(severityColorKey('MEDIA')).toBe('accent');
    expect(severityColorKey('NORMAL')).toBe('green');
  });
});
