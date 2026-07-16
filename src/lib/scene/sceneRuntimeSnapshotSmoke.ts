import { createCombatant, createCombatRuntimeTableState } from '../combat/combatRuntimeTypes';
import { createMapBoardState, createMapToken } from '../map/mapRuntimeTypes';
import {
  createSceneRuntimeSnapshot,
  importSceneRuntimeSnapshot,
  sanitizeSceneRuntimeSnapshot,
  summarizeSceneRuntimeSnapshot,
  validateSceneRuntimeSnapshot,
} from './sceneRuntimeSnapshot';

const cases: Array<{ name: string; passed: boolean }> = [];

function check(name: string, condition: unknown): void {
  cases.push({ name, passed: Boolean(condition) });
}

const combatant = createCombatant({
  id: 'hero-1',
  displayName: 'Hero',
  kind: 'character',
  sourceType: 'campaign_actor',
  sourceActorInstanceId: 'actor-1',
  initiative: 17,
  initiativeModifier: 3,
  hpCurrent: 12,
  hpMax: 20,
  conditions: ['Blessed'],
});
const combat = { ...createCombatRuntimeTableState(), combatants: [combatant], turn: { status: 'active' as const, roundNumber: 2, turnIndex: 0, activeCombatantId: combatant.id } };
const map = createMapBoardState('map-1');
map.backgroundUrl = 'https://example.test/scene.png';
map.backgroundName = 'Scene';
map.zoom = 1.2;
map.panX = 10;
map.panY = -4;
map.tokens = [createMapToken({ id: 'token-1', name: 'Hero', x: 45, y: 60, size: 'medium', sourceType: 'combatant', sourceCombatantId: combatant.id })];

const context = { roomId: 'room-1', campaignId: 'campaign-1', runtimeSessionId: 'runtime-1' };
const both = createSceneRuntimeSnapshot({ context, combat, map, exportedAt: '2026-07-16T00:00:00.000Z' });
const empty = createSceneRuntimeSnapshot({ context, exportedAt: '2026-07-16T00:00:00.000Z' });

check('exports schema version 1', both.schemaVersion === 1 && both.appFeature === 'scene-runtime-snapshot');
check('exports empty snapshot', !empty.combat && !empty.map);
check('exports combat state', both.combat?.combatants[0]?.displayName === 'Hero' && both.combat.turn.roundNumber === 2);
check('exports map board', both.map?.board.backgroundUrl === 'https://example.test/scene.png' && both.map.board.tokens.length === 1);

const valid = validateSceneRuntimeSnapshot(JSON.parse(JSON.stringify(both)), context);
check('validates exported snapshot', valid.ok && valid.snapshot.map?.board.tokens[0]?.id === 'token-1');
const malformed = validateSceneRuntimeSnapshot('{not-json}', context);
check('rejects malformed object input', malformed.ok === false);
const unsupported = validateSceneRuntimeSnapshot({ ...both, schemaVersion: 2 }, context);
check('rejects unsupported version', unsupported.ok === false);
const incomplete = validateSceneRuntimeSnapshot({ schemaVersion: 1, appFeature: 'scene-runtime-snapshot' }, context);
check('rejects missing export time', incomplete.ok === false);

const imported = importSceneRuntimeSnapshot(JSON.parse(JSON.stringify(both)), context);
check('imports combat and map deterministically', imported.ok && imported.snapshot.combat?.combatants.length === 1 && imported.snapshot.map?.board.tokens.length === 1);
const mismatched = importSceneRuntimeSnapshot(JSON.parse(JSON.stringify(both)), { roomId: 'room-2', campaignId: 'campaign-2', runtimeSessionId: 'runtime-2' });
check('warns about context mismatch', mismatched.ok && mismatched.warnings.length === 3);

const summary = summarizeSceneRuntimeSnapshot(both);
check('summarizes combatants tokens and background', summary.combatantCount === 1 && summary.tokenCount === 1 && summary.hasMapBackground);
const sanitized = sanitizeSceneRuntimeSnapshot({
  ...both,
  combat: { ...combat, combatants: [{ ...combatant, controllerUserId: 'private-user' }] },
  map: { board: { ...map, tokens: [...map.tokens, { ...map.tokens[0], id: 'token-1' }] } },
  metadata: { title: 'Local scene', notes: 'No credentials' },
} as typeof both);
check('sanitizes duplicate tokens and private controller references', sanitized.map?.board.tokens.length === 1 && sanitized.combat?.combatants[0]?.controllerUserId === undefined);
check('snapshot contains no environment or authorization payload', !JSON.stringify(sanitized).includes('authorization'));

const failed = cases.filter((test) => !test.passed);
console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases, notes: ['Scene snapshots are local JSON only. They do not add database, live-sync, asset, or permission behavior.'] }, null, 2));
if (failed.length > 0) process.exitCode = 1;
