import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeApiUrl, parseArguments, seedAurora } from './seed-aurora-1.mjs';

function fakeApi({ interrupt = false } = {}) {
  const rows = Object.fromEntries(['modules', 'sensors', 'systems', 'readings', 'events', 'alerts'].map(key => [key, []]));
  const next = { modules: 500, sensors: 900, systems: 1300, readings: 1700, events: 2100, alerts: 2500 };
  const methods = [];
  let interrupted = false;
  const fetcher = async (input, options) => {
    const url = new URL(input);
    const resource = url.pathname.split('/')[2];
    methods.push(options.method);
    if (resource === 'mission') return Response.json({ status: 'CRITICAL', checkedAt: '2026-01-01T12:00:00Z', activeCriticalAlerts: rows.alerts.length });
    assert.ok(Object.hasOwn(rows, resource));
    if (options.method === 'GET') {
      const page = Number(url.searchParams.get('page'));
      return Response.json({ content: rows[resource].slice(page * 2, page * 2 + 2), totalPages: Math.ceil(rows[resource].length / 2) });
    }
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    for (const [field, parent] of [['moduleId', 'modules'], ['sensorId', 'sensors'], ['systemId', 'systems']]) {
      if (body[field] !== undefined) assert.ok(rows[parent].some(row => row.id === body[field]), 'Referência inexistente: ' + field);
    }
    const record = { id: next[resource]++, ...body };
    rows[resource].push(record);
    if (interrupt && !interrupted && resource === 'readings' && body.value === 24.4) {
      interrupted = true;
      throw new TypeError('Conexão perdida depois do commit da leitura');
    }
    return Response.json(record, { status: 201 });
  };
  return { rows, methods, fetcher, snapshot: () => JSON.stringify(rows) };
}

test('URL configurável aceita raiz e base /api', () => {
  assert.equal(normalizeApiUrl('http://example.test:18080'), 'http://example.test:18080/api');
  assert.equal(normalizeApiUrl('https://example.test/prefix/api/'), 'https://example.test/prefix/api');
  assert.equal(parseArguments([], { AURORA_API_URL: 'http://environment.test' }).apiUrl, 'http://environment.test/api');
  assert.equal(parseArguments(['--api-url', 'http://argument.test'], { AURORA_API_URL: 'http://environment.test' }).apiUrl, 'http://argument.test/api');
});

test('argumentos e URLs inválidos são recusados antes de usar a API', () => {
  for (const url of ['file:///tmp/a', 'http://user:password@example.test', 'http://example.test/api?q=1', 'http://example.test/api#hash']) {
    assert.throws(() => normalizeApiUrl(url));
  }
  assert.throws(() => parseArguments(['--api-url'], {}));
  assert.throws(() => parseArguments(['--unknown'], {}));
  assert.equal(parseArguments(['--help'], {}).help, true);
});

test('banco vazio: cria todos os componentes com IDs retornados e paginação', async () => {
  const api = fakeApi();
  const result = await seedAurora({ apiUrl: 'http://example.test', fetcher: api.fetcher });
  assert.equal(result.created.length, 29);
  assert.deepEqual(result.totals, { modules: 3, sensors: 3, systems: 3, readings: 15, events: 4, alerts: 1 });
  assert.equal(api.rows.sensors[0].moduleId, result.entities.centralModule.id);
  assert.equal(api.rows.systems[1].moduleId, result.entities.navigationModule.id);
  assert.equal(api.rows.alerts[0].systemId, result.entities.lifeSupportSystem.id);
  assert.ok(result.readings.every(reading => api.rows.sensors.some(sensor => sensor.id === reading.sensorId)));
  assert.ok(api.methods.every(method => ['GET', 'POST'].includes(method)));
});

test('segunda execução mantém IDs, datas e valores, sem nenhum POST adicional', async () => {
  const api = fakeApi();
  const first = await seedAurora({ fetcher: api.fetcher });
  const before = api.snapshot();
  const postCount = api.methods.filter(method => method === 'POST').length;
  const second = await seedAurora({ fetcher: api.fetcher });
  assert.equal(second.created.length, 0);
  assert.equal(second.reused.length, 29);
  assert.equal(second.anchor, first.anchor);
  assert.equal(api.snapshot(), before);
  assert.equal(api.methods.filter(method => method === 'POST').length, postCount);
});

test('retoma falha após commit sem duplicar a leitura ou deslocar a linha temporal', async () => {
  const api = fakeApi({ interrupt: true });
  await assert.rejects(seedAurora({ fetcher: api.fetcher }), /Nenhum POST é repetido automaticamente/);
  const marker = api.rows.events[0].occurredAt;
  const result = await seedAurora({ fetcher: api.fetcher });
  assert.equal(result.totals.readings, 15);
  assert.equal(result.totals.events, 4);
  assert.equal(api.rows.events[0].occurredAt, marker);
  assert.equal(new Set(api.rows.readings.map(row => row.sensorId + '/' + row.recordedAt)).size, 15);
});

test('reaproveita nomes legados e alerta ativo anterior sem modificar seus dados', async () => {
  const api = fakeApi();
  await seedAurora({ fetcher: api.fetcher });
  api.rows.modules[0].name = 'Computador de bordo';
  api.rows.modules[1].name = 'Módulo de Navegação';
  api.rows.sensors[0].name = 'Temperatura da cabine';
  api.rows.systems[0].name = 'Suporte à vida';
  api.rows.alerts[0].title = 'Verificar suporte à vida';
  api.rows.alerts[0].occurredAt = '2020-01-01T00:00:00Z';
  const before = api.snapshot();
  const result = await seedAurora({ fetcher: api.fetcher });
  assert.equal(result.created.length, 0);
  assert.equal(api.snapshot(), before);
});

test('conflito de medição interrompe sem sobrescrever ou duplicar o registro', async () => {
  const api = fakeApi();
  await seedAurora({ fetcher: api.fetcher });
  api.rows.readings[0].value = 999;
  const before = api.snapshot();
  await assert.rejects(seedAurora({ fetcher: api.fetcher }), /Conflito.*temperature-0/);
  assert.equal(api.snapshot(), before);
});

test('nomes ambíguos interrompem em vez de escolher um ID ou criar duplicação', async () => {
  const api = fakeApi();
  await seedAurora({ fetcher: api.fetcher });
  api.rows.modules.push({ ...api.rows.modules[0], id: 700 });
  const before = api.snapshot();
  await assert.rejects(seedAurora({ fetcher: api.fetcher }), /Mais de um registro/);
  assert.equal(api.snapshot(), before);
});
