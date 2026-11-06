#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Este teste lê o backup; o único banco que ele pode migrar é sua própria cópia temporária.
const options = {};
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  if (!['--backup', '--manifest', '--expected-sha256', '--report'].includes(key) || !process.argv[index + 1] || options[key]) throw new Error('Informe --backup, --manifest, --expected-sha256 e --report.');
  options[key] = process.argv[index + 1];
}
for (const key of ['--backup', '--manifest', '--expected-sha256', '--report']) assert.ok(options[key], key + ' obrigatório');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const jar = join(root, 'backend/target/space-mission-control-0.0.1-SNAPSHOT.jar');
const java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
const backup = resolve(options['--backup']);
const originalBytes = await readFile(backup);
const hash = createHash('sha256').update(originalBytes).digest('hex');
assert.equal(hash, options['--expected-sha256'].toLowerCase(), 'Hash do backup diferente do esperado');
const manifest = JSON.parse(await readFile(options['--manifest'], 'utf8'));
const expected = structuredClone(manifest.records);
for (const { resource, id, after } of manifest.changes) Object.assign(expected[resource].find(record => record.id === id), after);
const directory = await mkdtemp(join(tmpdir(), 'presentation-cleanup-integration-'));
const database = join(directory, 'mission.mv.db');
const input = join(directory, 'approved.json');
await copyFile(backup, database);
// O backup pode estar protegido: restaura escrita exclusivamente na cópia temporária.
await chmod(database, 0o600);
await writeFile(input, JSON.stringify(manifest));
const result = { backupSha256: hash, checks: [] };

async function command(name, manifestPath = input, apply = false, succeeds = true) {
  const report = join(directory, name + '.json');
  const args = ['-Dloader.main=br.com.fiap.spacemission.migration.PresentationCleanupCommand', '-cp', jar,
    'org.springframework.boot.loader.launch.PropertiesLauncher', '--database-file', database, '--manifest', manifestPath, '--report', report,
    ...(apply ? ['--apply'] : [])];
  await new Promise((resolveRun, reject) => {
    const child = spawn(java, args, { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Timeout no processo isolado')); }, 90000);
    const collect = chunk => { output = (output + chunk.toString()).slice(-14000); };
    child.stdout.on('data', collect); child.stderr.on('data', collect);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => {
      clearTimeout(timer);
      if (succeeds ? code === 0 : code !== 0) resolveRun();
      else reject(new Error(name + ': resultado inesperado ' + code + '\n' + output));
    });
  });
  return succeeds ? JSON.parse(await readFile(report, 'utf8')) : undefined;
}
try {
  const dryRun = await command('dry-run');
  assert.equal(dryRun.dryRun, true);
  assert.equal(dryRun.changedRecords, manifest.changes.length);
  assert.deepEqual(dryRun.records, manifest.records);
  result.checks.push('Backup reaberto e inventário completo confirmado; simulação sem alterações.');
  const conflict = structuredClone(manifest);
  conflict.records.readings[0].value += 1;
  const conflictingInput = join(directory, 'conflict.json');
  await writeFile(conflictingInput, JSON.stringify(conflict));
  await command('conflict', conflictingInput, true, false);
  assert.deepEqual((await command('after-conflict')).records, manifest.records);
  result.checks.push('Divergência em leitura protegida recusada integralmente; todos os registros preservados.');
  const applied = await command('apply', input, true);
  assert.equal(applied.changedRecords, manifest.changes.length);
  assert.deepEqual(applied.records, expected);
  const repeat = await command('repeat', input, true);
  assert.equal(repeat.changedRecords, 0);
  assert.equal(repeat.alreadyApplied, true);
  assert.deepEqual(repeat.records, expected);
  result.checks.push('Migração em arquivo: alterações exatas, IDs/vínculos/medições preservados e repetição sem mudanças.');
  assert.equal(createHash('sha256').update(await readFile(backup)).digest('hex'), hash);
  result.changedRecords = applied.changedRecords;
  result.preservedRecords = applied.preservedRecords;
  result.totals = applied.totals;
  result.passed = true;
  await writeFile(resolve(options['--report']), JSON.stringify(result, null, 2), { flag: 'wx' });
  console.log(JSON.stringify(result, null, 2));
} finally {
  const location = relative(resolve(tmpdir()), resolve(directory));
  if (!location || location.startsWith('..') || isAbsolute(location) || !location.startsWith('presentation-cleanup-integration-')) throw new Error('Limpeza fora da pasta temporária recusada');
  await rm(directory, { recursive: true, force: true });
}
