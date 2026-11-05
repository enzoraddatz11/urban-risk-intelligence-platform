#!/usr/bin/env node
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const RESOURCES = ['modules', 'sensors', 'systems', 'readings', 'events', 'alerts'];
const MINUTE = 60_000;
const ORBIT_EVENT = 'AURORA-1 | Correção orbital validada';
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');

export function normalizeApiUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Informe uma URL HTTP(S), sem credenciais, query ou fragmento.');
  }
  url.pathname = url.pathname === '/' ? '/api' : url.pathname.replace(/\/+$/, '');
  return url.toString().replace(/\/$/, '');
}

export function parseArguments(args, environment = process.env) {
  let apiUrl = environment.AURORA_API_URL || 'http://localhost:8080/api';
  let help = false;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--help' || args[index] === '-h') help = true;
    else if (args[index] === '--api-url' && args[index + 1] && !args[index + 1].startsWith('--')) apiUrl = args[++index];
    else throw new Error('Argumento inválido: ' + args[index] + '. Use --help.');
  }
  return { apiUrl: normalizeApiUrl(apiUrl), help };
}

function assertFields(record, expected, context) {
  if (!Number.isSafeInteger(record.id) || record.id <= 0) throw new Error('ID inválido retornado em ' + context);
  for (const [key, value] of Object.entries(expected)) {
    if (['name', 'title', 'description'].includes(key)) continue;
    const equal = key.endsWith('At') ? Date.parse(record[key]) === Date.parse(value) : record[key] === value;
    if (!equal) throw new Error('Conflito em ' + context + ', campo ' + key + '. O registro existente foi preservado.');
  }
}

export async function seedAurora({ apiUrl = 'http://localhost:8080/api', fetcher = fetch, log = () => {}, timeoutMs = 15_000 } = {}) {
  const baseUrl = normalizeApiUrl(apiUrl);
  const report = { apiUrl: baseUrl, anchor: null, created: [], reused: [], entities: {}, readings: [] };

  async function request(route, body) {
    let response;
    try {
      response = await fetcher(baseUrl + route, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new Error('Falha de conexão em ' + route + '. Nenhum POST é repetido automaticamente; execute novamente para consultar o que já foi salvo.', { cause: error });
    }
    const data = await response.json();
    if (!response.ok || (body !== undefined && response.status !== 201)) {
      throw new Error('HTTP ' + response.status + ' em ' + route + ': ' + (data.message ?? 'Resposta inesperada'));
    }
    return data;
  }

  async function list(resource) {
    const records = [];
    for (let page = 0; ; page++) {
      const result = await request('/' + resource + '?page=' + page + '&size=100');
      if (!Array.isArray(result.content) || !Number.isInteger(result.totalPages) || result.totalPages < 0) {
        throw new Error('Paginação inválida em ' + resource);
      }
      records.push(...result.content);
      if (page + 1 >= result.totalPages) return records;
    }
  }

  function matchingNames(records, names) {
    const normalized = names.map(normalize);
    return records.filter(record => normalized.includes(normalize(record.name ?? record.title)));
  }

  async function ensure(resource, key, body, aliases = [], ignoreOnReuse = []) {
    // Consulta nova antes de cada possível POST, inclusive após uma execução parcial.
    const records = await list(resource);
    const matches = resource === 'readings'
      ? records.filter(record => record.sensorId === body.sensorId && Date.parse(record.recordedAt) === Date.parse(body.recordedAt))
      : matchingNames(records, [body.name ?? body.title, ...aliases]);
    if (matches.length > 1) throw new Error('Mais de um registro corresponde a ' + key + '. Nenhuma duplicação será criada.');
    const record = matches[0] ?? await request('/' + resource, body);
    const expected = { ...body };
    if (matches.length) for (const field of ignoreOnReuse) delete expected[field];
    assertFields(record, expected, resource + '/' + key);
    const result = { key, resource, id: record.id };
    report[matches.length ? 'reused' : 'created'].push(result);
    report.entities[key] = { ...result, name: record.name ?? record.title };
    log((matches.length ? 'Reutilizado: ' : 'Criado: ') + resource + ' #' + record.id + ' (' + key + ')');
    return record;
  }

  const central = await ensure('modules', 'centralModule', {
    name: 'Computador Central de Bordo', description: 'AURORA-1 | Controle central e processamento da telemetria ambiental.', status: 'OPERATIONAL',
  }, ['Computador de bordo']);
  const navigation = await ensure('modules', 'navigationModule', {
    name: 'Computador de Navegação', description: 'AURORA-1 | Cálculos de trajetória e validação de correções orbitais.', status: 'OPERATIONAL',
  }, ['Módulo de Navegação']);
  const communication = await ensure('modules', 'communicationModule', {
    name: 'Módulo de Comunicação', description: 'AURORA-1 | Processamento do enlace de comunicação e transmissão de telemetria.', status: 'OPERATIONAL',
  }, ['Computador de Comunicação', 'Unidade de Comunicação']);
  const temperature = await ensure('sensors', 'temperatureSensor', {
    name: 'Sensor de Temperatura', type: 'TEMPERATURE', unit: '°C', status: 'OPERATIONAL', moduleId: central.id,
  }, ['Temperatura da cabine', 'Sensor de Temperatura da Cabine']);
  const pressure = await ensure('sensors', 'pressureSensor', {
    name: 'Sensor de Pressão', type: 'PRESSURE', unit: 'kPa', status: 'OPERATIONAL', moduleId: central.id,
  }, ['Pressão da cabine', 'Sensor de Pressão da Cabine']);
  const oxygen = await ensure('sensors', 'oxygenSensor', {
    name: 'Sensor de Oxigênio', type: 'OXYGEN', unit: '%', status: 'OPERATIONAL', moduleId: central.id,
  }, ['Oxigênio da cabine', 'Sensor de Oxigênio da Cabine']);
  const lifeSupport = await ensure('systems', 'lifeSupportSystem', {
    name: 'Sistema de Suporte à Vida', description: 'AURORA-1 | Monitoramento ambiental sob atenção durante a simulação de queda de pressão.', status: 'DEGRADED', moduleId: central.id,
  }, ['Suporte à vida']);
  const propulsion = await ensure('systems', 'propulsionSystem', {
    name: 'Sistema de Propulsão', description: 'AURORA-1 | Monitoramento da sequência de correção orbital.', status: 'OPERATIONAL', moduleId: navigation.id,
  }, ['Propulsão']);
  const communicationSystem = await ensure('systems', 'communicationSystem', {
    name: 'Sistema de Comunicação', description: 'AURORA-1 | Monitoramento do enlace de comunicação e da transmissão de telemetria.', status: 'OPERATIONAL', moduleId: communication.id,
  }, ['Comunicação', 'Sistema de Comunicações']);

  // O primeiro evento é o marcador persistido da linha temporal. Não há estado local obrigatório.
  const markers = matchingNames(await list('events'), [ORBIT_EVENT]);
  if (markers.length > 1) throw new Error('Mais de um evento de início da AURORA-1 foi encontrado.');
  let anchor;
  if (markers.length) {
    assertFields(markers[0], { severity: 'INFO', systemId: propulsion.id }, 'marcador AURORA-1');
    anchor = Date.parse(markers[0].occurredAt) + 10 * MINUTE;
  } else {
    anchor = Date.parse((await request('/mission/status')).checkedAt) - MINUTE;
  }
  if (!Number.isFinite(anchor) || anchor > Date.now()) throw new Error('Data inválida ou futura no início da demonstração.');
  report.anchor = new Date(anchor).toISOString();
  const at = minutes => new Date(anchor + minutes * MINUTE).toISOString();
  await ensure('events', 'orbitValidated', {
    title: ORBIT_EVENT, description: 'AURORA-1 | Demonstração acadêmica: sequência de correção orbital validada pelo computador de navegação.',
    severity: 'INFO', systemId: propulsion.id, occurredAt: at(-10),
  });

  const series = [
    ['temperature', temperature.id, [24.1, 24.3, 24.4, 24.6, 24.8]],
    ['pressure', pressure.id, [101.3, 100.5, 97.8, 93.6, 88.9]],
    ['oxygen', oxygen.id, [20.9, 20.9, 20.8, 20.9, 20.8]],
  ];
  for (const [key, sensorId, values] of series) {
    for (const [index, value] of values.entries()) {
      const record = await ensure('readings', key + '-' + index, { sensorId, value, recordedAt: at(-8 + index * 2) });
      report.readings.push({ id: record.id, sensorId, value: record.value, recordedAt: record.recordedAt });
    }
  }
  await ensure('events', 'communicationEstablished', {
    title: 'AURORA-1 | Enlace de comunicação estabelecido', description: 'AURORA-1 | Enlace estabelecido para transmissão da telemetria da missão simulada.',
    severity: 'INFO', systemId: communicationSystem.id, occurredAt: at(-8),
  });
  await ensure('events', 'pressureDrop', {
    title: 'AURORA-1 | Queda de pressão detectada', description: 'AURORA-1 | Queda simulada da pressão da cabine; suporte à vida degradado e monitoramento crítico ativo.',
    severity: 'CRITICAL', systemId: lifeSupport.id, occurredAt: at(-2),
  });
  await ensure('events', 'lifeSupportContingency', {
    title: 'AURORA-1 | Contingência de suporte à vida iniciada', description: 'AURORA-1 | Procedimento simulado de isolamento e verificação iniciado; ocorrência ainda sob monitoramento.',
    severity: 'WARNING', systemId: lifeSupport.id, occurredAt: at(0),
  });
  await ensure('alerts', 'criticalAlert', {
    title: 'AURORA-1 | Verificar suporte à vida', description: 'AURORA-1 | Alerta crítico da demonstração de queda de pressão; investigação em andamento.',
    status: 'ACTIVE', systemId: lifeSupport.id, occurredAt: at(-2),
  }, ['Verificar suporte à vida'], ['occurredAt']);

  report.totals = {};
  for (const resource of RESOURCES) report.totals[resource] = (await list(resource)).length;
  report.mission = await request('/mission/status');
  return report;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log('Uso: node scripts/seed-aurora-1.mjs [--api-url http://localhost:8080/api]\nAlternativa: variável AURORA_API_URL. Apenas GET/POST; nenhum registro é editado ou excluído.');
    return;
  }
  const report = await seedAurora({ ...options, log: message => console.error(message) });
  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
