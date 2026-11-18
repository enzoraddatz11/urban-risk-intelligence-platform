#!/usr/bin/env node
// Integração ponta a ponta com backend ISOLADO: H2 em pasta temporária e porta livre.
// Nunca usa o banco de desenvolvimento (backend/data) nem as portas 8080/8081.
//   node scripts/test-integration.mjs                -> backend: carga simulada, alertas e persistência
//   node scripts/test-integration.mjs --with-mobile  -> também cliente do app (GET/POST) e interface no Chromium
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const jar = join(project, 'backend', 'target', 'urban-risk-intelligence-0.0.1-SNAPSHOT.jar');
const java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
const withMobile = process.argv.includes('--with-mobile');
if (process.argv.slice(2).some(argument => argument !== '--with-mobile')) throw new Error('Use apenas --with-mobile ou nenhum argumento.');
if (!existsSync(jar)) throw new Error('Gere o JAR primeiro: cd backend && mvn verify');
const directory = await mkdtemp(join(tmpdir(), 'urban-risk-integration-'));
const processes = new Set();

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

async function start(database, webPort) {
  let output = '';
  const child = spawn(java, ['-jar', jar,
    // No Windows, SIGTERM encerra sem hooks: WRITE_DELAY=0 confirma os commits no arquivo antes do reinício.
    '--server.port=0', '--spring.datasource.url=jdbc:h2:file:' + join(directory, database).replaceAll('\\', '/') + ';WRITE_DELAY=0',
    '--app.seed-enabled=true', '--app.cors-origins=http://localhost:' + webPort,
    '--spring.main.banner-mode=off',
  ], { cwd: join(project, 'backend'), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  processes.add(child);
  const url = await new Promise((resolveStart, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout de inicialização do backend isolado.\n' + output.slice(-6000))), 60000);
    let port;
    const handle = chunk => {
      output = (output + chunk.toString()).slice(-20000);
      const match = /Tomcat started on port (\d+)/.exec(output);
      if (match) port = Number(match[1]);
      if (port && /Started UrbanRiskApplication/.test(output)) {
        clearTimeout(timer);
        if ([8080, 8081].includes(port)) { reject(new Error('Porta reservada ao ambiente local.')); return; }
        resolveStart('http://localhost:' + port + '/api');
      }
    };
    child.stdout.on('data', handle); child.stderr.on('data', handle);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error('Backend isolado encerrou: ' + code + '\n' + output.slice(-6000))); });
  });
  // A carga simulada roda logo após a mensagem Started.
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const status = await (await fetch(url + '/status')).json();
      if (status.regions > 0) return { child, url };
    } catch { /* servidor ainda iniciando */ }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 100));
  }
  throw new Error('A carga simulada do backend isolado não terminou.');
}

const json = async (url, init) => { const response = await fetch(url, init); return { status: response.status, body: await response.json() }; };

try {
  const webPort = await freePort();
  let server = await start('city', webPort);
  const status = (await json(server.url + '/status')).body;
  assert.equal(status.status, 'CRITICO');
  assert.deepEqual([status.regions, status.sensors, status.readings, status.events, status.reports], [5, 6, 24, 6, 10]);
  const alerts = (await json(server.url + '/alerts')).body;
  assert.deepEqual(alerts.map(alert => alert.priority), ['CRITICA', 'ALTA', 'ALTA', 'MEDIA', 'BAIXA']);
  assert.ok(alerts.every((alert, index) => index === 0 || alerts[index - 1].score >= alert.score), 'alertas fora de ordem');
  assert.ok(alerts.every(alert => alert.source && Number.isInteger(alert.confidence) && alert.confidenceLevel), 'alerta sem origem/confiança');
  const blocked = await json(server.url + '/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ regionId: 1, riskType: 'ALAGAMENTO', description: 'Me liguem (11) 98765-4321', occurredAt: new Date().toISOString() }) });
  assert.equal(blocked.status, 400);
  console.log('OK: cidade simulada carregada, alertas ordenados com origem e confiança, relato com telefone recusado.');

  const created = await json(server.url + '/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ regionId: 1, riskType: 'ALAGAMENTO', description: 'Relato de persistência.', occurredAt: new Date().toISOString() }) });
  assert.equal(created.status, 201);
  await stop(server.child);
  server = await start('city', webPort);
  assert.equal((await json(server.url + '/reports/' + created.body.id)).body.description, 'Relato de persistência.');
  assert.equal((await json(server.url + '/status')).body.reports, 11, 'a carga simulada não pode se repetir no reinício');
  console.log('OK: dados persistidos após reiniciar o H2 em arquivo, sem duplicar a carga simulada.');

  if (withMobile) {
    const mobile = join(project, 'mobile');
    const env = { EXPO_PUBLIC_API_URL: server.url, EXPO_WEB_PORT: String(webPort), CI: '1', BROWSER: 'none' };
    await runNode([join(mobile, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'vitest.live.config.mts'], mobile, env);
    await runNode([join(mobile, 'node_modules/@playwright/test/cli.js'), 'test'], mobile, env);
    console.log('OK: cliente do app (GET/POST) e interface no Chromium executados contra o backend isolado.');
  }
} finally {
  for (const child of [...processes]) await stop(child);
  // Remove somente a pasta temporária criada por este processo, nunca o banco do projeto.
  const location = relative(resolve(tmpdir()), resolve(directory));
  if (!location || location.startsWith('..') || isAbsolute(location) || !location.startsWith('urban-risk-integration-')) {
    throw new Error('Pasta temporária fora do escopo esperado; limpeza recusada.');
  }
  await rm(directory, { recursive: true, force: true });
}
