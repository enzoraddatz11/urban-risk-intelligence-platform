import type { CityStatus, PrioritizedAlert, Severity } from '../types/api';

const rank: Record<Severity, number> = { BAIXA: 0, MEDIA: 1, ALTA: 2, CRITICA: 3 };
/** Prioridades que geram notificação no aplicativo. */
export const NOTIFY_FROM: Severity = 'ALTA';

export function isNotifiable(alert: PrioritizedAlert): boolean {
  return rank[alert.priority] >= rank[NOTIFY_FROM];
}

/** Alertas prioritários ainda não notificados, do maior para o menor score. */
export function newNotifiableAlerts(alerts: PrioritizedAlert[], notified: ReadonlySet<number>): PrioritizedAlert[] {
  return alerts.filter(alert => isNotifiable(alert) && !notified.has(alert.eventId))
    .sort((a, b) => b.score - a.score || rank[b.severity] - rank[a.severity]);
}

export function notificationText(alerts: PrioritizedAlert[]): { title: string; body: string } | null {
  if (!alerts.length) return null;
  const [top] = alerts;
  const label = top.priority === 'CRITICA' ? 'Alerta crítico' : 'Alerta de prioridade alta';
  return {
    title: alerts.length === 1 ? label + ' em ' + top.regionName : alerts.length + ' novos alertas prioritários',
    body: top.title + (alerts.length > 1 ? ' · e mais ' + (alerts.length - 1) : ''),
  };
}

export function sensorHealth(status: CityStatus) {
  const total = status.sensors;
  const operational = Math.max(0, total - status.offlineSensors - status.unstableSensors);
  return { total, operational, unstable: status.unstableSensors, offline: status.offlineSensors,
    percentage: total > 0 ? Math.round(100 * operational / total) : null };
}

export function severityColorKey(value: string): 'red' | 'orange' | 'accent' | 'green' | 'blue' {
  if (['CRITICA', 'CRITICO', 'OFFLINE', 'ATIVO'].includes(value)) return 'red';
  if (['ALTA', 'ATENCAO', 'INSTAVEL'].includes(value)) return 'orange';
  if (['MEDIA', 'MEDIO'].includes(value)) return 'accent';
  if (['NORMAL', 'OPERANTE', 'ENCERRADO', 'ALTO'].includes(value)) return 'green';
  return 'blue';
}
