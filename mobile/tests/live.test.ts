// Integração opt-in: grava registros identificados no banco da API configurada.
import { expect, it } from 'vitest';
import { createApiClient, ApiError } from '../src/services/client';
import { buildPayload } from '../src/features/validation';
import type { Resource } from '../src/types/api';

it('consulta a cidade e cadastra/consulta os cinco recursos e os alertas usando o cliente do app', async () => {
  const api = createApiClient(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api');
  const tag = 'Teste mobile ' + new Date().toISOString();
  const now = () => new Date().toISOString();
  const status = await api.status();
  expect(['CRITICO', 'ATENCAO', 'NORMAL', 'SEM_DADOS']).toContain(status.status);
  const region = await api.create('regions', buildPayload('regions', {
    name: tag, city: 'Cidade de teste', description: 'Validação de integração do Expo', latitude: '-23,5', longitude: '-46,6',
    source: 'BASE_PUBLICA', confidence: '90',
  }));
  const sensor = await api.create('sensors', buildPayload('sensors', {
    name: tag, type: 'PLUVIOMETRO', unit: 'mm/h', status: 'OPERANTE', regionId: String(region.id), source: 'SENSOR', confidence: '90',
  }));
  const reading = await api.create('readings', buildPayload('readings', {
    sensorId: String(sensor.id), value: '42,5', recordedAt: now(), source: 'SENSOR', confidence: '90',
  }));
  const event = await api.create('events', buildPayload('events', {
    title: tag, description: 'Evento de teste encerrado', type: 'ALAGAMENTO', severity: 'BAIXA', status: 'ENCERRADO',
    occurredAt: now(), regionId: String(region.id), source: 'SENSOR', confidence: '90',
  }));
  const report = await api.create('reports', buildPayload('reports', {
    regionId: String(region.id), riskType: 'ALAGAMENTO', description: 'Relato de teste sem dados pessoais.', occurredAt: now(),
  }));
  const created = { regions: region, sensors: sensor, readings: reading, events: event, reports: report };
  for (const resource of Object.keys(created) as Resource[]) {
    const expected = created[resource];
    expect((await api.get(resource, expected.id)).id).toBe(expected.id);
  }
  expect(report.source).toBe('COMUNITARIO');
  expect(report.confidence).toBe(40);
  expect((await api.get('sensors', sensor.id)).regionId).toBe(region.id);
  expect((await api.get('readings', reading.id)).value).toBe(42.5);
  expect(await api.alerts(region.id)).toEqual([]);
  await expect(api.create('reports', { regionId: region.id, riskType: 'ALAGAMENTO', description: 'Me liguem: (11) 98765-4321', occurredAt: now() }))
    .rejects.toMatchObject({ status: 400 });
  await expect(api.create('regions', { ...buildPayload('regions', { name: 'x', city: 'x', description: 'x', latitude: '0', longitude: '0', source: 'SENSOR', confidence: '1' }), name: '' }))
    .rejects.toBeInstanceOf(ApiError);
  console.info('IDs criados na API real:', Object.fromEntries(Object.entries(created).map(([key, value]) => [key, value.id])));
});
