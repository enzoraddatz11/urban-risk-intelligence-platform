import type { Resource } from '../types/api';

export type Option = { label: string; value: string };
export type Field = {
  key: string; label: string; kind: 'text' | 'select' | 'relation' | 'date' | 'decimal';
  max?: number; multiline?: boolean; placeholder?: string; options?: Option[]; relation?: Resource;
};
export type ResourceDefinition = {
  title: string; singular: string; subtitle: string; icon: 'hardware-chip-outline' | 'radio-outline' | 'pulse-outline' | 'layers-outline' | 'terminal-outline' | 'warning-outline';
  fields: Field[];
};
const health: Field = { key: 'status', label: 'Estado operacional', kind: 'select', options: [
  { label: 'Operacional', value: 'OPERATIONAL' }, { label: 'Degradado', value: 'DEGRADED' }, { label: 'Offline', value: 'OFFLINE' },
]};
const name: Field = { key: 'name', label: 'Nome', kind: 'text', max: 100, placeholder: 'Ex.: Computador de bordo' };
const description: Field = { key: 'description', label: 'Descrição', kind: 'text', max: 500, multiline: true, placeholder: 'Descreva a função ou o contexto' };
const title: Field = { key: 'title', label: 'Título', kind: 'text', max: 100, placeholder: 'Descreva o registro em poucas palavras' };
const moduleField: Field = { key: 'moduleId', label: 'Módulo computacional', kind: 'relation', relation: 'modules' };
const systemField: Field = { key: 'systemId', label: 'Sistema monitorado', kind: 'relation', relation: 'systems' };
const date: Field = { key: 'occurredAt', label: 'Data e hora do ocorrido', kind: 'date', placeholder: '2026-01-01T12:00:00Z' };

export const resources: Record<Resource, ResourceDefinition> = {
  sensors: { title: 'Sensores', singular: 'sensor', subtitle: 'Instrumentos conectados à missão', icon: 'radio-outline', fields: [
    { ...name, placeholder: 'Ex.: Temperatura da cabine' },
    { key: 'type', label: 'Tipo', kind: 'text', max: 80, placeholder: 'Ex.: TEMPERATURE' },
    { key: 'unit', label: 'Unidade', kind: 'text', max: 30, placeholder: 'Ex.: °C, kPa ou %' }, health, moduleField,
  ] },
  readings: { title: 'Leituras', singular: 'leitura', subtitle: 'Histórico de medições recebidas', icon: 'pulse-outline', fields: [
    { key: 'sensorId', label: 'Sensor', kind: 'relation', relation: 'sensors' },
    { key: 'value', label: 'Valor da medição', kind: 'decimal', placeholder: 'Ex.: -12,5' },
    { ...date, key: 'recordedAt', label: 'Data e hora da medição' },
  ] },
  modules: { title: 'Módulos', singular: 'módulo', subtitle: 'Capacidade computacional de bordo', icon: 'hardware-chip-outline', fields: [name, description, health] },
  systems: { title: 'Sistemas', singular: 'sistema', subtitle: 'Infraestrutura monitorada da missão', icon: 'layers-outline', fields: [name, description, health, moduleField] },
  events: { title: 'Eventos', singular: 'evento', subtitle: 'Registro de operações e ocorrências', icon: 'terminal-outline', fields: [
    title, description,
    { key: 'severity', label: 'Severidade', kind: 'select', options: [
      { label: 'Informação', value: 'INFO' }, { label: 'Atenção', value: 'WARNING' }, { label: 'Crítico', value: 'CRITICAL' },
    ] }, date, systemField,
  ] },
  alerts: { title: 'Alertas', singular: 'alerta', subtitle: 'Ocorrências críticas da missão', icon: 'warning-outline', fields: [
    title, description,
    { key: 'status', label: 'Situação do alerta', kind: 'select', options: [
      { label: 'Ativo', value: 'ACTIVE' }, { label: 'Resolvido', value: 'RESOLVED' },
    ] }, date, systemField,
  ] },
};

export const statusLabels: Record<string, string> = {
  OPERATIONAL: 'Operacional', DEGRADED: 'Degradado', OFFLINE: 'Offline',
  ACTIVE: 'Ativo', RESOLVED: 'Resolvido', INFO: 'Informação', WARNING: 'Atenção',
  CRITICAL: 'Crítico', NOMINAL: 'Nominal', UNKNOWN: 'Sem dados',
};
export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}
