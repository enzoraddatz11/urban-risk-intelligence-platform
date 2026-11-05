import { describe, expect, it } from 'vitest';
import { buildPayload, FormValidationError, initialValues } from '../src/features/validation';
import { resolveApiUrl } from '../src/config/url';
import type { Resource } from '../src/types/api';
import { resources } from '../src/features/resources';

function validValues(resource: Resource) {
  const result = initialValues(resource);
  for (const field of resources[resource].fields) {
    if (field.kind === 'text') result[field.key] = 'Registro de teste';
    if (field.kind === 'relation') result[field.key] = '7';
    if (field.kind === 'decimal') result[field.key] = '-12,5';
    if (field.kind === 'date') result[field.key] = '2020-01-01T00:00:00Z';
  }
  return result;
}
describe('Contratos de formulário', () => {
  it.each(Object.keys(resources) as Resource[])('%s gera apenas os campos do DTO', resource => {
    const payload = buildPayload(resource, validValues(resource));
    expect(Object.keys(payload).sort()).toEqual(resources[resource].fields.map(field => field.key).sort());
  });
  it('normaliza vírgula decimal e IDs para números', () => {
    const payload = buildPayload('readings', validValues('readings'));
    expect(payload.value).toBe(-12.5); expect(payload.sensorId).toBe(7);
    expect(payload.recordedAt).toBe('2020-01-01T00:00:00.000Z');
  });
  it('não aceita texto obrigatório vazio', () => {
    expect(() => buildPayload('modules', { ...validValues('modules'), name: ' ' })).toThrow(FormValidationError);
  });
  it('respeita limites de comprimento do backend', () => {
    expect(() => buildPayload('sensors', { ...validValues('sensors'), unit: 'x'.repeat(31) })).toThrow();
  });
  it('rejeita valores fora do enum', () => {
    expect(() => buildPayload('modules', { ...validValues('modules'), status: 'READY' })).toThrow();
  });
  it.each(['0', '-1', '1.2', 'abc', '9007199254740992'])('rejeita referência inválida %s', value => {
    expect(() => buildPayload('sensors', { ...validValues('sensors'), moduleId: value })).toThrow();
  });
  it.each(['1.1234567', '1234567890123', '1e3', 'NaN', '1.234,5', '999999999999.123456'])('rejeita decimal inválido %s', value => {
    expect(() => buildPayload('readings', { ...validValues('readings'), value })).toThrow();
  });
  it.each(['2999-01-01T00:00:00Z', '2020-01-01T00:00:00', '2020-02-31T00:00:00Z', '2020-01-01T24:00:00Z', 'inválida'])('rejeita data inválida ou futura %s', recordedAt => {
    expect(() => buildPayload('readings', { ...validValues('readings'), recordedAt })).toThrow();
  });
  it('aceita data com fuso e normaliza para UTC', () => {
    expect(buildPayload('events', { ...validValues('events'), occurredAt: '2020-01-01T12:00:00-03:00' }).occurredAt).toBe('2020-01-01T15:00:00.000Z');
  });
});
describe('Endereço central da API', () => {
  it('prioriza configuração explícita e remove barra final', () => {
    expect(resolveApiUrl({ override: 'http://192.168.0.8:8080/api/', platform: 'android' })).toBe('http://192.168.0.8:8080/api');
  });
  it('utiliza IP do computador servido pelo Expo', () => {
    expect(resolveApiUrl({ platform: 'ios', hostUri: '192.168.0.8:8081' })).toBe('http://192.168.0.8:8080/api');
  });
  it('utiliza endereço do host Android Emulator como fallback', () => {
    expect(resolveApiUrl({ platform: 'android', hostUri: 'localhost:8081' })).toBe('http://10.0.2.2:8080/api');
  });
  it('utiliza hostname do navegador para web', () => {
    expect(resolveApiUrl({ platform: 'web', webHostname: 'localhost' })).toBe('http://localhost:8080/api');
  });
  it('rejeita protocolo inadequado', () => {
    expect(() => resolveApiUrl({ override: 'file:///etc/app', platform: 'web' })).toThrow();
  });
});
