export type DataSource = 'SENSOR' | 'BASE_PUBLICA' | 'COMUNITARIO';
export type ConfidenceLevel = 'ALTO' | 'MEDIO' | 'BAIXO';
export type SensorType = 'PLUVIOMETRO' | 'NIVEL_RIO' | 'TEMPERATURA' | 'ENERGIA' | 'AGUA';
export type SensorStatus = 'OPERANTE' | 'INSTAVEL' | 'OFFLINE';
export type RiskType = 'ALAGAMENTO' | 'ILHA_DE_CALOR' | 'FALTA_DE_ENERGIA' | 'FALTA_DE_AGUA';
export type Severity = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type EventStatus = 'ATIVO' | 'ENCERRADO';
export type CityStatusValue = 'CRITICO' | 'ATENCAO' | 'NORMAL' | 'SEM_DADOS';

type Provenance = { source: DataSource; confidence: number };
export type RegionRequest = Provenance & { name: string; city: string; description: string; latitude: number; longitude: number };
export type SensorRequest = Provenance & { name: string; type: SensorType; unit: string; status: SensorStatus; regionId: number };
export type ReadingRequest = Provenance & { value: number; recordedAt: string; sensorId: number };
export type EventRequest = Provenance & {
  title: string; description: string; type: RiskType; severity: Severity; status: EventStatus; occurredAt: string; regionId: number;
};
/** Relato anônimo: origem e confiança são atribuídas pelo servidor. */
export type ReportRequest = { regionId: number; riskType: RiskType; description: string; occurredAt: string };

export interface RequestMap {
  regions: RegionRequest; sensors: SensorRequest; readings: ReadingRequest; events: EventRequest; reports: ReportRequest;
}
export type Resource = keyof RequestMap;
export type Tracked = { id: number; source: DataSource; confidence: number; confidenceLevel: ConfidenceLevel };
export type EntityMap = { [K in Resource]: RequestMap[K] & Tracked };
export type UrbanEntity = EntityMap[Resource];
export interface Page<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number }

export interface AlertFactors { severity: number; confidence: number; corroboration: number; freshness: number }
export interface PrioritizedAlert {
  eventId: number; title: string; description: string; riskType: RiskType; severity: Severity;
  regionId: number; regionName: string; source: DataSource; confidence: number; confidenceLevel: ConfidenceLevel;
  communityReports: number; lastReadingAt: string | null; occurredAt: string; score: number; priority: Severity; factors: AlertFactors;
}
export interface CityStatus {
  status: CityStatusValue; checkedAt: string; regions: number; sensors: number; readings: number; events: number;
  activeEvents: number; reports: number; offlineSensors: number; unstableSensors: number; criticalAlerts: number; highAlerts: number;
}
export interface ApiErrorBody { message?: string; errors?: Record<string, string>; status?: number }
