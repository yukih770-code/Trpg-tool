import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

// Behavioral regression selection for this frontend composition change.
const names = [
  "frontend:verify:actor-cloud-sync",
  "frontend:verify:campaign-room",
  "frontend:verify:local-playable-lobby",
  "frontend:verify:scene-snapshot",
  "frontend:verify:scene-state",
  "frontend:verify:campaign-actor-overrides",
  "frontend:verify:dnd-lite-actor",
  "frontend:verify:personal-content-adapter",
  "frontend:verify:workshop-truthful-empty-state",
  "runtime:verify:room-binding-campaign-actor",
  "runtime:verify:cloud-room-launch",
  "runtime:verify:character-source-hash"
];
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const results = names.map(name => {
  const command = pkg.scripts[name];
  if (!command?.startsWith('tsx ') || command.includes('&&')) throw new Error(`Unexpected command: ${name}`);
  const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', ...command.slice(4).split(' ')], { encoding: 'utf8', windowsHide: true, timeout: 90000 });
  const entry = { name, command, exitCode: result.status, output: result.stdout + result.stderr, error: result.error?.message };
  console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${name}`);
  if (result.status !== 0) console.log(entry.output);
  return entry;
});
mkdirSync('docs/implementation/product-ia-reuse', { recursive: true });
writeFileSync('docs/implementation/product-ia-reuse/additional-regression-results.json', JSON.stringify(results, null, 2));
console.log(`${results.filter(r => r.exitCode === 0).length}/${results.length} regression commands passed`);
process.exitCode = results.every(result => result.exitCode === 0) ? 0 : 1;
