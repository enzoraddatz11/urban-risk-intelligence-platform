#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedAurora } from './seed-aurora-1.mjs';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const jar = join(project, 'backend', 'target', 'space-mission-control-0.0.1-SNAPSHOT.jar');
const java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
const withMobile = process.argv.includes('--with-mobile');
if (process.argv.slice(2).some(argument => argument !== '--with-mobile')) throw new Error('Use apenas --with-mobile ou nenhum argumento.');
if (!existsSync(jar)) throw new Error('Gere o JAR primeiro: cd backend && mvn verify');
const directory = await mkdtemp(join(tmpdir(), 'aurora-1-integration-'));
const processes = new Set();
const resources = ['modules', 'sensors', 'systems', 'readings', 'events', 'alerts'];

function runNode(args, cwd, env) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolveRun() : reject(new Error('Comando Node terminou com código ' + code)));
  });
}

async function freePort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  const port = server.address().port;
  await new Promise(resolveClose => server.close(resolveClose));
  return port;
}

async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) { processes.delete(child); return; }
  await new Promise((resolveStop, reject) => {
    const timer = setTimeout(() => reject(new Error('O backend isolado não encerrou no prazo.')), 15000);
    child.once('exit', () => { clearTimeout(timer); resolveStop(); });
    child.kill('SIGTERM');
  });
  processes.delete(child);
}

async function start(database, seedEnabled, webPort) {
  let output = '';
  const child = spawn(java, ['-jar', jar,
    // No Windows, SIGTERM encerra sem hooks: confirma os commits no arquivo antes de testar o reinício.
    '--server.port=0', '--spring.datasource.url=jdbc:h2:file:' + join(directory, database).replaceAll('\\', '/') + ';WRITE_DELAY=0',
    '--app.seed-enabled=' + seedEnabled, '--app.cors-origins=http://localhost:' + webPort,
    '--spring.main.banner-mode=off', '--logging.level.root=INFO', '--debug=false',
  ], { cwd: join(project, 'backend'), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  processes.add(child);
  const url = await new Promise((resolveStart, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout de inicialização do backend isolado.\n' + output.slice(-6000))), 60000);
    let port;
    const handle = chunk => {
      output = (output + chunk.toString()).slice(-20000);
      const match = /Tomcat started on port (\d+)/.exec(output);
      if (match) port = Number(match[1]);
      if (port && /Started SpaceMissionApplication/.test(output)) {
        clearTimeout(timer);
        if ([8080, 8081].includes(port)) { reject(new Error('Porta reservada ao ambiente local.')); return; }
        resolveStart('http://localhost:' + port + '/api');
      }
    };
    child.stdout.on('data', handle); child.stderr.on('data', handle);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error('Backend isolado encerrou: ' + code + '\n' + output.slice(-6000))); });
  });
  // Aguarda também a carga inicial, que acontece depois da mensagem Started.
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const status = await (await fetch(url + '/mission/status')).json();
      if (!seedEnabled || status.modules > 0) return { child, url };
    } catch { /* servidor ainda iniciando */ }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 100));
  }
  throw new Error('A carga de exemplos do backend isolado não terminou.');
}

async function snapshot(url) {
  const result = {};
  for (const resource of resources) {
    result[resource] = [];
    for (let page = 0; ; page++) {
      const response = await fetch(url + '/' + resource + '?size=100&page=' + page);
      assert.equal(response.status, 200);
      const data = await response.json();
      result[resource].push(...data.content);
      if (page + 1 >= data.totalPages) break;
    }
    result[resource].sort((a, b) => a.id - b.id);
  }
  return result;
}

function assertPreserved(before, after) {
  for (const resource of resources) {
    for (const record of before[resource]) assert.deepEqual(after[resource].find(row => row.id === record.id), record);
  }
}

async function validateDetails(url, report) {
  for (const entity of [...report.created, ...report.reused]) {
    const response = await fetch(url + '/' + entity.resource + '/' + entity.id);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).id, entity.id);
  }
  const state = await snapshot(url);
  const sensorIds = new Set(state.sensors.map(row => row.id));
  const moduleIds = new Set(state.modules.map(row => row.id));
  const systemIds = new Set(state.systems.map(row => row.id));
  assert.ok(state.sensors.every(row => moduleIds.has(row.moduleId)));
  assert.ok(state.systems.every(row => moduleIds.has(row.moduleId)));
  assert.ok(state.readings.every(row => sensorIds.has(row.sensorId)));
  assert.ok([...state.events, ...state.alerts].every(row => systemIds.has(row.systemId)));
  assert.equal(report.mission.status, 'CRITICAL');
  assert.equal(report.mission.activeCriticalAlerts, 1);
}

try {
  const webPort = await freePort();
  let server = await start('empty-mission', false, webPort);
  const empty = await snapshot(server.url);
  assert.ok(resources.every(resource => empty[resource].length === 0));
  const first = await seedAurora({ apiUrl: server.url });
  assert.equal(first.created.length, 29);
  assert.deepEqual(first.totals, { modules: 3, sensors: 3, systems: 3, readings: 15, events: 4, alerts: 1 });
  await validateDetails(server.url, first);
  const populated = await snapshot(server.url);
  const second = await seedAurora({ apiUrl: server.url });
  assert.equal(second.created.length, 0);
  assert.equal(second.reused.length, 29);
  assert.deepEqual(await snapshot(server.url), populated);
  console.log('OK: banco H2 novo, 29 registros completos, IDs e vínculos válidos; repetição sem duplicações.');

  await stop(server.child);
  server = await start('empty-mission', false, webPort);
  assert.deepEqual(await snapshot(server.url), populated);
  assert.equal((await seedAurora({ apiUrl: server.url })).created.length, 0);
  console.log('OK: persistência após reiniciar o H2 em arquivo e nova repetição idempotente.');

  if (withMobile) {
    const mobile = join(project, 'mobile');
    const env = { EXPO_PUBLIC_API_URL: server.url, EXPO_WEB_PORT: String(webPort), CI: '1', BROWSER: 'none' };
    await runNode([join(mobile, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'vitest.live.config.mts'], mobile, env);
    await runNode([join(mobile, 'node_modules/@playwright/test/cli.js'), 'test'], mobile, env);
    assertPreserved(populated, await snapshot(server.url));
    console.log('OK: testes mobile GET/POST e interface executados somente no backend isolado.');
  }
  await stop(server.child);

  server = await start('legacy-mission', true, webPort);
  const legacy = await snapshot(server.url);
  assert.ok(resources.every(resource => legacy[resource].length === 1));
  const reused = await seedAurora({ apiUrl: server.url });
  assert.equal(reused.created.length, 25);
  assertPreserved(legacy, await snapshot(server.url));
  const beforeRepeat = await snapshot(server.url);
  assert.equal((await seedAurora({ apiUrl: server.url })).created.length, 0);
  assert.deepEqual(await snapshot(server.url), beforeRepeat);
  await validateDetails(server.url, reused);
  console.log('OK: exemplos legados reaproveitados sem alteração; segunda execução sem novos cadastros.');
} finally {
  for (const child of [...processes]) await stop(child);
  // Remove somente a pasta temporária criada por este processo, nunca o banco do projeto.
  const location = relative(resolve(tmpdir()), resolve(directory));
  if (!location || location.startsWith('..') || isAbsolute(location) || !location.startsWith('aurora-1-integration-')) {
    throw new Error('Pasta temporária fora do escopo esperado; limpeza recusada.');
  }
  await rm(directory, { recursive: true, force: true });
}
