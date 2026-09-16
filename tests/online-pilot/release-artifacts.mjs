import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parse } from 'dotenv';

const source = new URL('../../server/db/migrations/', import.meta.url);
const compiled = new URL('../../dist-server/server/db/migrations/', import.meta.url);
const files = readdirSync(source).filter((name) => name.endsWith('.sql')).sort();
assert.ok(files.length > 0);
assert.deepEqual(readdirSync(compiled).filter((name) => name.endsWith('.sql')).sort(), files);
for (const name of files) assert.deepEqual(readFileSync(new URL(name, compiled)), readFileSync(new URL(name, source)));
const html = readFileSync(new URL('../../dist/index.html', import.meta.url), 'utf8');
const expectedOrigin = process.argv[2];
assert.ok(expectedOrigin && html.includes(expectedOrigin), 'Pass the public origin used by build:pilot.');
const envFile = new URL('../../.env', import.meta.url);
const environment = { ...(existsSync(envFile) ? parse(readFileSync(envFile)) : {}), ...process.env };
let checked = 0;
for (const [key, value] of Object.entries(environment)) {
  if (/DATABASE_URL|PASSWORD|SECRET|API_KEY|ACCESS_CODE|TOKEN/i.test(key) && typeof value === 'string' && value.length >= 12) {
    assert.ok(!html.includes(value), `Backend configuration leaked into frontend artifact (${key}).`);
    checked++;
  }
}
const trackedEnv = execFileSync('git', ['ls-files', '-z', '.env*'], { encoding: 'utf8', windowsHide: true }).split('\0').filter(Boolean);
assert.ok(trackedEnv.every((file) => /^\.env(?:\.[a-z.]+)?\.example$/.test(file)), 'A non-example environment file is tracked.');
console.log(JSON.stringify({ migrationFiles: files.length, copiedByteForByte: true, publicOriginPresent: true, backendValuesCheckedAgainstBundle: checked, trackedEnvExamplesOnly: true }));
