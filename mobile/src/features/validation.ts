import type { RequestMap, Resource } from '../types/api';
import { resources } from './resources';
import { findPersonalData, PRIVACY_MESSAGE } from './privacy';

export type FormValues = Record<string, string>;
export class FormValidationError extends Error {
  constructor(public readonly fields: Record<string, string>) { super('Revise os campos destacados.'); }
}
export function initialValues(resource: Resource): FormValues {
  return Object.fromEntries(resources[resource].fields.map(field => [
    field.key, field.kind === 'date' ? new Date().toISOString() : field.kind === 'select' ? field.options![0].value : '',
  ]));
}
export function buildPayload<K extends Resource>(resource: K, values: FormValues, now = Date.now()): RequestMap[K] {
  const errors: Record<string, string> = {};
  const payload: Record<string, string | number> = {};
  for (const field of resources[resource].fields) {
    const value = (values[field.key] ?? '').trim();
    if (!value) { errors[field.key] = 'Campo obrigatório.'; continue; }
    if (field.max && value.length > field.max) { errors[field.key] = 'Use até ' + field.max + ' caracteres.'; continue; }
    if (field.privacy && findPersonalData(value).length) { errors[field.key] = PRIVACY_MESSAGE; continue; }
    if (field.kind === 'integer') {
      const numeric = Number(value);
      if (!/^-?\d{1,9}$/.test(value)) errors[field.key] = 'Informe um número inteiro.';
      else if (field.min !== undefined && numeric < field.min || field.maxValue !== undefined && numeric > field.maxValue) errors[field.key] = 'Use um valor entre ' + field.min + ' e ' + field.maxValue + '.';
      else payload[field.key] = numeric;
    } else if (field.kind === 'relation') {
      if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
        errors[field.key] = 'Selecione um registro válido.';
      } else payload[field.key] = Number(value);
    } else if (field.kind === 'select') {
      if (!field.options?.some(option => option.value === value)) errors[field.key] = 'Selecione uma opção válida.';
      else payload[field.key] = value;
    } else if (field.kind === 'decimal') {
      const normalized = value.replace(',', '.');
      if (!/^-?\d{1,12}(\.\d{1,6})?$/.test(normalized)) errors[field.key] = 'Use até 12 dígitos inteiros e 6 casas decimais, sem separador de milhar.';
      else {
        const numeric = Number(normalized);
        const fraction = normalized.split('.')[1]?.length ?? 0;
        const canonical = (text: string) => text.replace(/^(-?)0+(?=\d)/, '$1').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '').replace(/^-0$/, '0');
        if (canonical(numeric.toFixed(fraction)) !== canonical(normalized)) {
          errors[field.key] = 'Este valor excede a precisão numérica do aplicativo. Use menos casas decimais.';
        } else if (field.min !== undefined && numeric < field.min || field.maxValue !== undefined && numeric > field.maxValue) {
          errors[field.key] = 'Use um valor entre ' + field.min + ' e ' + field.maxValue + '.';
        } else payload[field.key] = numeric;
      }
    } else if (field.kind === 'date') {
      // Exige fuso explícito e data real antes de normalizar para Instant.
      const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
      const timestamp = Date.parse(value);
      const calendar = match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : null;
      const validCalendar = match && calendar && calendar.getUTCFullYear() === Number(match[1])
        && calendar.getUTCMonth() + 1 === Number(match[2]) && calendar.getUTCDate() === Number(match[3])
        && Number(match[4]) < 24 && Number(match[5]) < 60 && Number(match[6]) < 60;
      if (!validCalendar || !Number.isFinite(timestamp)) errors[field.key] = 'Informe uma data ISO válida com fuso, ex.: 2026-01-01T12:00:00Z.';
      else if (timestamp > now) errors[field.key] = 'A data não pode estar no futuro.';
      else payload[field.key] = new Date(timestamp).toISOString();
    } else payload[field.key] = value;
  }
  if (Object.keys(errors).length) throw new FormValidationError(errors);
  return payload as RequestMap[K];
}
