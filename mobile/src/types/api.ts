export type HealthStatus = 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';
export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'RESOLVED';
export type ModuleRequest = { name: string; description: string; status: HealthStatus };
export type SensorRequest = { name: string; type: string; unit: string; status: HealthStatus; moduleId: number };
export type SystemRequest = ModuleRequest & { moduleId: number };
export type ReadingRequest = { value: number; recordedAt: string; sensorId: number };
export type EventRequest = { title: string; description: string; severity: Severity; occurredAt: string; systemId: number };
export type AlertRequest = { title: string; description: string; status: AlertStatus; occurredAt: string; systemId: number };
export interface RequestMap {
  modules: ModuleRequest; sensors: SensorRequest; systems: SystemRequest;
  readings: ReadingRequest; events: EventRequest; alerts: AlertRequest;
}
export type Resource = keyof RequestMap;
export type EntityMap = { [K in Resource]: RequestMap[K] & { id: number } };
export type MissionEntity = EntityMap[Resource];
export interface Page<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number }
export interface MissionStatus {
  status: 'CRITICAL' | 'WARNING' | 'NOMINAL' | 'UNKNOWN';
  checkedAt: string; modules: number; sensors: number; systems: number; readings: number;
  events: number; activeCriticalAlerts: number; degradedComponents: number; offlineComponents: number;
}
export interface ApiErrorBody { message?: string; errors?: Record<string, string>; status?: number }
