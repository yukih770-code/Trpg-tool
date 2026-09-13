import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

// Behavioral regression selection for this frontend composition change.
const names = [
  "frontend:verify:dnd-level-one-character",

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
  "runtime:verify:character-source-hash",

  'runtime:verify:t12-resolver', 'runtime:verify:t12-kernel',
  'runtime:verify:t12-intents', 'runtime:verify:t12-visibility',
  'runtime:verify:t12-http', 'runtime:verify:t12-boundaries',
  'frontend:verify:t12-intents', 'frontend:verify:t12-rendering',
  'frontend:verify:combat-replay', 'frontend:verify:combat-runtime-table',
  'frontend:verify:combat-mode-hud', 'frontend:verify:runtime-combat-controls',
  'frontend:verify:runtime-action-dock', 'frontend:verify:runtime-overlay-coordination',
  'frontend:verify:runtime-player-turn-callout', 'frontend:verify:mobile-combat-hud-presentation',
  'runtime:verify:room-combat-controls', 'frontend:verify:dnd-comfort-combat',
  'frontend:verify:map-runtime', 'frontend:verify:runtime-map-tool-presentation',
  'frontend:verify:runtime-map-panel-coordination', 'frontend:verify:actor-presence',
  'frontend:verify:token-rendering', 'runtime:verify:token-ownership',
  'runtime:verify:runtime-visibility-projection', 'frontend:verify:token-inspect-safe-visual-surface',
  'frontend:verify:room-permissions', 'runtime:verify:room-permissions',
  'frontend:verify:room-player-flow', 'frontend:verify:room-lobby-ia',
  'frontend:verify:character-entry-cta', 'frontend:verify:character-clearance',
  'frontend:verify:room-socket-reconnect', 'runtime:verify:room-socket-reconnect',
  'runtime:verify:durable-append-confirmation', 'runtime:verify:live-room-log-recovery',
  'runtime:verify:room-runtime-actor-projection', 'runtime:verify:character-source-review',
  'frontend:verify:character-lite-sheet', 'runtime:verify:combatant-seed',
  'frontend:verify:server-content-set', 'platform:verify:room-system-registry',
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
mkdirSync('docs/implementation/user-journey-ia', { recursive: true });
writeFileSync('docs/implementation/user-journey-ia/regression-results.json', JSON.stringify(results, null, 2));
console.log(`${results.filter(r => r.exitCode === 0).length}/${results.length} regression commands passed`);
process.exitCode = results.every(result => result.exitCode === 0) ? 0 : 1;
