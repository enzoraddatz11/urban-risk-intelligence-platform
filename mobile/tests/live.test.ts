// Integração opt-in: grava registros identificados no banco da API configurada.
import { expect, it } from 'vitest';
import { createApiClient, ApiError } from '../src/services/client';
import { buildPayload } from '../src/features/validation';
import type { Resource } from '../src/types/api';

it('consulta a missão e cadastra/consulta os seis recursos usando o cliente do app', async () => {
  const api = createApiClient(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api');
  const tag = 'Teste mobile ' + new Date().toISOString();
  const status = await api.missionStatus();
  expect(['NOMINAL', 'WARNING', 'CRITICAL', 'UNKNOWN']).toContain(status.status);
  const module = await api.create('modules', buildPayload('modules', {
    name: tag, description: 'Validação de integração do Expo', status: 'OPERATIONAL',
  }));
  const sensor = await api.create('sensors', buildPayload('sensors', {
    name: tag, type: 'TEMPERATURE', unit: 'C', status: 'OPERATIONAL', moduleId: String(module.id),
  }));
  const system = await api.create('systems', buildPayload('systems', {
    name: tag, description: 'Sistema de teste mobile', status: 'OPERATIONAL', moduleId: String(module.id),
  }));
  const reading = await api.create('readings', buildPayload('readings', {
    sensorId: String(sensor.id), value: '-12,5', recordedAt: new Date().toISOString(),
  }));
  const event = await api.create('events', buildPayload('events', {
    title: tag, description: 'Teste do contrato de eventos', severity: 'INFO',
    systemId: String(system.id), occurredAt: new Date().toISOString(),
  }));
  const alert = await api.create('alerts', buildPayload('alerts', {
    title: tag, description: 'Alerta de teste já resolvido', status: 'RESOLVED',
    systemId: String(system.id), occurredAt: new Date().toISOString(),
  }));
  const created = { modules: module, sensors: sensor, systems: system, readings: reading, events: event, alerts: alert };
  for (const resource of Object.keys(created) as Resource[]) {
    const expected = created[resource];
    expect((await api.get(resource, expected.id)).id).toBe(expected.id);
    expect((await api.list(resource)).content.some(row => row.id === expected.id)).toBe(true);
  }
  expect((await api.get('sensors', sensor.id)).moduleId).toBe(module.id);
  expect((await api.get('readings', reading.id)).value).toBe(-12.5);
  await expect(api.create('modules', { name: '', description: 'Erro intencional de validação', status: 'OPERATIONAL' })).rejects.toBeInstanceOf(ApiError);
  console.info('IDs criados na API real:', Object.fromEntries(Object.entries(created).map(([key, value]) => [key, value.id])));
});
