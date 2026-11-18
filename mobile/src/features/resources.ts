import type { IconName } from '../components/app-icon';
import type { Resource } from '../types/api';

export type Option = { label: string; value: string };
export type Field = {
  key: string; label: string; kind: 'text' | 'select' | 'relation' | 'date' | 'decimal' | 'integer';
  max?: number; min?: number; maxValue?: number; multiline?: boolean; placeholder?: string; help?: string;
  options?: Option[]; relation?: Resource; privacy?: boolean;
};
export type ResourceDefinition = { title: string; singular: string; newLabel: string; subtitle: string; icon: IconName; fields: Field[] };

export const labels: Record<string, string> = {
  SENSOR: 'Sensor', BASE_PUBLICA: 'Base pública', COMUNITARIO: 'Comunitário',
  ALTO: 'Alta', MEDIO: 'Média', BAIXO: 'Baixa',
  PLUVIOMETRO: 'Pluviômetro', NIVEL_RIO: 'Nível de rio', TEMPERATURA: 'Temperatura', ENERGIA: 'Energia', AGUA: 'Água',
  OPERANTE: 'Operante', INSTAVEL: 'Instável', OFFLINE: 'Offline',
  ALAGAMENTO: 'Alagamento', ILHA_DE_CALOR: 'Ilha de calor', FALTA_DE_ENERGIA: 'Falta de energia', FALTA_DE_AGUA: 'Falta de água',
  BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', CRITICA: 'Crítica',
  ATIVO: 'Ativo', ENCERRADO: 'Encerrado',
  CRITICO: 'Crítico', ATENCAO: 'Atenção', NORMAL: 'Normal', SEM_DADOS: 'Sem dados',
};
const options = (...values: string[]): Option[] => values.map(value => ({ label: labels[value] ?? value, value }));

export const riskIcons: Record<string, IconName> = {
  ALAGAMENTO: 'water', ILHA_DE_CALOR: 'heat', FALTA_DE_ENERGIA: 'power-off', FALTA_DE_AGUA: 'water-off',
};

const source: Field = { key: 'source', label: 'Origem do dado', kind: 'select', options: options('SENSOR', 'BASE_PUBLICA', 'COMUNITARIO') };
const confidence: Field = { key: 'confidence', label: 'Confiança (0 a 100)', kind: 'integer', min: 0, maxValue: 100, placeholder: 'Ex.: 80',
  help: '70 ou mais = alta · 40 a 69 = média · abaixo de 40 = baixa.' };
const name: Field = { key: 'name', label: 'Nome', kind: 'text', max: 100 };
const description: Field = { key: 'description', label: 'Descrição', kind: 'text', max: 500, multiline: true, placeholder: 'Descreva a situação' };
const region: Field = { key: 'regionId', label: 'Bairro / região', kind: 'relation', relation: 'regions' };
const risk = options('ALAGAMENTO', 'ILHA_DE_CALOR', 'FALTA_DE_ENERGIA', 'FALTA_DE_AGUA');
const date: Field = { key: 'occurredAt', label: 'Data e hora da ocorrência', kind: 'date', placeholder: '2026-01-01T12:00:00Z' };

export const resources: Record<Resource, ResourceDefinition> = {
  regions: { title: 'Bairros', singular: 'bairro', newLabel: 'Novo bairro', subtitle: 'Regiões monitoradas da cidade', icon: 'map', fields: [
    { ...name, placeholder: 'Ex.: Várzea do Ribeirão' },
    { key: 'city', label: 'Cidade', kind: 'text', max: 100, placeholder: 'Ex.: Nova Ribeira' },
    { ...description, placeholder: 'Características e riscos conhecidos do bairro' },
    { key: 'latitude', label: 'Latitude', kind: 'decimal', min: -90, maxValue: 90, placeholder: 'Ex.: -23,5480' },
    { key: 'longitude', label: 'Longitude', kind: 'decimal', min: -180, maxValue: 180, placeholder: 'Ex.: -46,6010' },
    source, confidence,
  ] },
  sensors: { title: 'Sensores', singular: 'sensor', newLabel: 'Novo sensor', subtitle: 'Instrumentos urbanos instalados nos bairros', icon: 'radio-outline', fields: [
    { ...name, placeholder: 'Ex.: Pluviômetro da praça' },
    { key: 'type', label: 'Tipo de sensor', kind: 'select', options: options('PLUVIOMETRO', 'NIVEL_RIO', 'TEMPERATURA', 'ENERGIA', 'AGUA') },
    { key: 'unit', label: 'Unidade', kind: 'text', max: 30, placeholder: 'Ex.: mm/h, m, °C, kV' },
    { key: 'status', label: 'Situação do sensor', kind: 'select', options: options('OPERANTE', 'INSTAVEL', 'OFFLINE') },
    region, source, confidence,
  ] },
  readings: { title: 'Leituras', singular: 'leitura', newLabel: 'Nova leitura', subtitle: 'Medições recebidas dos sensores', icon: 'pulse-outline', fields: [
    { key: 'sensorId', label: 'Sensor', kind: 'relation', relation: 'sensors' },
    { key: 'value', label: 'Valor medido', kind: 'decimal', placeholder: 'Ex.: 46,5' },
    { ...date, key: 'recordedAt', label: 'Data e hora da medição' },
    source, confidence,
  ] },
  events: { title: 'Eventos', singular: 'evento', newLabel: 'Novo evento', subtitle: 'Riscos identificados na cidade', icon: 'warning-outline', fields: [
    { key: 'title', label: 'Título', kind: 'text', max: 100, placeholder: 'Ex.: Rua alagada na Várzea' },
    description,
    { key: 'type', label: 'Tipo de risco', kind: 'select', options: risk },
    { key: 'severity', label: 'Gravidade', kind: 'select', options: options('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') },
    { key: 'status', label: 'Situação', kind: 'select', options: options('ATIVO', 'ENCERRADO') },
    date, region, source, confidence,
  ] },
  reports: { title: 'Relatos', singular: 'relato', newLabel: 'Novo relato', subtitle: 'Relatos anônimos de moradores', icon: 'groups', fields: [
    region,
    { key: 'riskType', label: 'O que está acontecendo?', kind: 'select', options: risk },
    { ...description, label: 'Relato', privacy: true, placeholder: 'Ex.: Água na altura da canela na avenida principal.',
      help: 'Não informe nome, telefone, e-mail, CPF ou endereço da sua casa. O relato é anônimo.' },
    { ...date, label: 'Quando aconteceu' },
  ] },
};

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}
export function timeAgo(value: string | null, now = Date.now()): string {
  if (!value) return 'sem leitura';
  const minutes = Math.max(0, Math.round((now - Date.parse(value)) / 60000));
  if (!Number.isFinite(minutes)) return value;
  if (minutes < 1) return 'agora';
  if (minutes < 60) return 'há ' + minutes + ' min';
  const hours = Math.round(minutes / 60);
  return hours < 48 ? 'há ' + hours + ' h' : 'há ' + Math.round(hours / 24) + ' dias';
}
