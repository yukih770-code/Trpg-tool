import { replayCombatRuntimeEvents } from '../combat/combatRuntimeReplay.js';
import { replayMapRuntimeEvents } from '../map/mapRuntimeReplay.js';
import { runtimeAcDisplayLabel, runtimeHpDisplayLabel } from './roomRuntimeVisibility.js';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

expect(runtimeHpDisplayLabel({ kind: 'exact', current: 7, max: 12 }) === 'HP 7/12', 'exact HP is rendered');
expect(runtimeHpDisplayLabel({ kind: 'stage', stage: 'bloodied' }) === '生命状态：重伤', 'injury stage is rendered');
expect(runtimeHpDisplayLabel({ kind: 'unknown' }) === 'HP：未知', 'unknown HP stays hidden');
expect(runtimeAcDisplayLabel({ kind: 'unknown' }) === 'AC：未知', 'unknown AC stays hidden');

const map = replayMapRuntimeEvents([{ eventKind: 'map.token_added', seq: 1, payload: { token: { id: 'safe-token', name: 'Unknown enemy', x: 50, y: 50, size: 'medium', sourceType: 'unknown', informationVisibility: 'public', hpDisplay: { kind: 'stage', stage: 'wounded' }, acDisplay: { kind: 'unknown' }, visibility: 'publicObserved', relation: 'enemy' } } }], 'safe-map');
expect(map.tokens[0]?.hpDisplay?.kind === 'stage' && map.tokens[0]?.acDisplay?.kind === 'unknown', 'projected map token survives replay');
expect(map.tokens[0]?.informationVisibility === 'public', 'host information visibility setting survives replay');

const combat = replayCombatRuntimeEvents([{ eventKind: 'combat.started', seq: 1, payload: { combatants: [{ id: 'enemy', displayName: 'Unknown enemy', sourceType: 'unknown', kind: 'npc', initiative: 10, initiativeModifier: 0, hpDisplay: { kind: 'stage', stage: 'bloodied' }, acDisplay: { kind: 'unknown' }, visibility: 'publicObserved', relation: 'enemy' }], roundNumber: 1, turnIndex: 0, activeCombatantId: 'enemy' } }]);
expect(combat.combatants[0]?.hpDisplay?.kind === 'stage' && combat.combatants[0]?.hpCurrent === undefined, 'projected combatant replays without exact HP');

console.log('Runtime token inspect visual smoke passed: safe labels and projected map/combat replay.');
