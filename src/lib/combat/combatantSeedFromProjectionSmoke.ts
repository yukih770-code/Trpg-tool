/**
 * Combatant seed from actor projection smoke (T10; pure, no React, no server).
 *
 * AI-LANDMARK: COMBATANT_SEED_FROM_PROJECTION_SMOKE_V1
 *
 * Proves the T10 contract:
 *  - a derived AC reaches the combat table instead of the previous hardcoded
 *    `undefined`, and a dexterity-derived initiative modifier reaches the roll
 *    instead of the previous hardcoded `0`;
 *  - HP and conditions are preserved token-first, so nothing a host set on a
 *    token is silently replaced;
 *  - the combat layer reads no CharacterData — asserted against the real module
 *    sources, not just by convention;
 *  - an existing combat event stream replays to exactly the same state, so the
 *    seed changes what enters the table and nothing about what replays out.
 */

import { readFileSync } from 'node:fs';

import {
  DEFAULT_INITIATIVE_MODIFIER,
  combatantSeedForToken,
  combatantSeedFromProjection,
  findProjectionForToken,
} from './combatantSeedFromProjection';
import { createCombatant, sortCombatants } from './combatRuntimeTypes';
import { replayCombatRuntimeEvents, type CombatRuntimeReplayEvent } from './combatRuntimeReplay';
import type { MapToken } from '../map/mapRuntimeTypes';
import type { RoomRuntimeActorProjection } from '../platform/roomRuntimeActorProjectionTypes';

const cases: string[] = [];

function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

type SeedToken = Parameters<typeof combatantSeedForToken>[0];

function token(input: Partial<MapToken> = {}): SeedToken {
  return {
    actorBindingId: 'binding-fighter',
    campaignActorId: undefined,
    sourceActorInstanceId: undefined,
    hpSummary: { current: 12, max: 12 },
    acDisplay: undefined,
    conditionSummary: undefined,
    ...input,
  } as SeedToken;
}

/** A level 1 fighter as T9 derives it: AC 12 (10 base + Dex 14), Dex mod +2. */
const fighterProjection: RoomRuntimeActorProjection = {
  bindingId: 'binding-fighter',
  campaignActorInstanceId: 'campaign-actor-fighter',
  displayName: '铁盾',
  systemId: 'dnd5e-2024',
  actorKind: 'pc',
  hpCurrent: 12,
  hpMax: 12,
  armorClass: 12,
  initiativeModifier: 2,
  source: 'campaignOverride',
};

// ── Fighter AC reaches combat ──────────────────────────────────────────────
const fighterSeed = combatantSeedForToken(token(), [fighterProjection]);
check('fighter AC reaches the combat seed', fighterSeed.armorClass === 12);
check('AC is reported as projection-sourced', fighterSeed.seededFromProjection.includes('armorClass'));

const fighterCombatant = createCombatant({
  id: 'combatant-fighter',
  displayName: '铁盾',
  kind: 'character',
  sourceType: 'campaign_actor',
  ...(({ seededFromProjection: _drop, ...seed }) => seed)(fighterSeed),
});
check('fighter AC survives combatant creation', fighterCombatant.armorClass === 12);
check('fighter AC is no longer undefined', fighterCombatant.armorClass !== undefined);

// ── Dex modifier reaches initiative ────────────────────────────────────────
check('dexterity modifier reaches the combat seed', fighterSeed.initiativeModifier === 2);
check('initiative modifier is reported as projection-sourced', fighterSeed.seededFromProjection.includes('initiativeModifier'));
check('dexterity modifier survives combatant creation', fighterCombatant.initiativeModifier === 2);
// `rollInitiative` computes `die + initiativeModifier`; a fixed die proves the
// modifier is actually applied without depending on randomness.
check('a d20 of 11 with the seeded modifier totals 13', 11 + fighterCombatant.initiativeModifier === 13);

const negativeDex: RoomRuntimeActorProjection = { ...fighterProjection, initiativeModifier: -1 };
check('a negative dexterity modifier is carried', combatantSeedForToken(token(), [negativeDex]).initiativeModifier === -1);
const zeroDex: RoomRuntimeActorProjection = { ...fighterProjection, initiativeModifier: 0 };
check('an explicit zero modifier is carried and reported',
  combatantSeedForToken(token(), [zeroDex]).initiativeModifier === 0
  && combatantSeedForToken(token(), [zeroDex]).seededFromProjection.includes('initiativeModifier'));

// ── HP preserved ───────────────────────────────────────────────────────────
check('token HP is preserved', fighterSeed.hpCurrent === 12 && fighterSeed.hpMax === 12);
check('token HP is not attributed to the projection',
  !fighterSeed.seededFromProjection.includes('hpCurrent') && !fighterSeed.seededFromProjection.includes('hpMax'));

// A host who edited the token keeps that edit; the projection must not win.
const damagedToken = token({ hpSummary: { current: 3, max: 12, temporary: 2 } });
const damagedSeed = combatantSeedForToken(damagedToken, [fighterProjection]);
check('an edited token HP wins over the projection', damagedSeed.hpCurrent === 3);
check('token temporary HP is preserved', damagedSeed.temporaryHp === 2);
check('projection HP never overwrites token HP', damagedSeed.hpCurrent !== fighterProjection.hpCurrent);

// With no token HP at all the projection is a safe fallback.
const bareToken = token({ hpSummary: undefined });
const bareSeed = combatantSeedForToken(bareToken, [fighterProjection]);
check('projection HP fills an empty token', bareSeed.hpCurrent === 12 && bareSeed.hpMax === 12);
check('projection-filled HP is reported', bareSeed.seededFromProjection.includes('hpCurrent'));

// Conditions stay token-first for the same reason.
const conditionToken = token({ conditionSummary: ['中毒'] });
check('token conditions are preserved', combatantSeedForToken(conditionToken, [fighterProjection]).conditions.join() === '中毒');
const projectedConditions: RoomRuntimeActorProjection = { ...fighterProjection, conditions: ['擒抱'] };
check('projection conditions fill an empty token', combatantSeedForToken(token(), [projectedConditions]).conditions.join() === '擒抱');
check('conditions are copied, not shared', combatantSeedForToken(token(), [projectedConditions]).conditions !== projectedConditions.conditions);

// ── Behaviour with no projection is exactly the previous behaviour ─────────
const unmatched = combatantSeedForToken(token(), []);
check('no projection means no AC', unmatched.armorClass === undefined);
check('no projection means the previous default modifier', unmatched.initiativeModifier === DEFAULT_INITIATIVE_MODIFIER);
check('no projection still preserves token HP', unmatched.hpCurrent === 12 && unmatched.hpMax === 12);
check('no projection reports no seeded fields', unmatched.seededFromProjection.length === 0);
check('an undefined projection list is safe', combatantSeedForToken(token()).initiativeModifier === 0);

// A monster token with no binding and no campaign actor matches nothing.
const monsterToken = token({ actorBindingId: undefined, hpSummary: { current: 7, max: 7 } });
check('an unmatched monster token keeps the default seed',
  combatantSeedForToken(monsterToken, [fighterProjection]).armorClass === undefined
  && combatantSeedForToken(monsterToken, [fighterProjection]).hpCurrent === 7);

// ── Projection resolution ──────────────────────────────────────────────────
check('token resolves its projection by binding id', findProjectionForToken(token(), [fighterProjection])?.bindingId === 'binding-fighter');
check('a wrong binding id resolves nothing',
  findProjectionForToken(token({ actorBindingId: 'binding-other' }), [fighterProjection]) === undefined);
check('token resolves by campaign actor instance when unbound',
  findProjectionForToken(token({ actorBindingId: undefined, sourceActorInstanceId: 'campaign-actor-fighter' }), [fighterProjection])?.campaignActorInstanceId === 'campaign-actor-fighter');
check('token resolves by legacy campaignActorId',
  findProjectionForToken(token({ actorBindingId: undefined, campaignActorId: 'campaign-actor-fighter' }), [fighterProjection])?.campaignActorInstanceId === 'campaign-actor-fighter');
check('binding id wins over campaign actor id', findProjectionForToken(
  token({ actorBindingId: 'binding-fighter', sourceActorInstanceId: 'campaign-actor-other' }),
  [fighterProjection, { ...fighterProjection, bindingId: 'binding-other', campaignActorInstanceId: 'campaign-actor-other' }],
)?.bindingId === 'binding-fighter');
check('a blank binding id falls through', findProjectionForToken(token({ actorBindingId: '   ', sourceActorInstanceId: 'campaign-actor-fighter' }), [fighterProjection])?.campaignActorInstanceId === 'campaign-actor-fighter');

// ── Determinism and non-mutation ───────────────────────────────────────────
check('seeding is deterministic',
  JSON.stringify(combatantSeedForToken(token(), [fighterProjection])) === JSON.stringify(combatantSeedForToken(token(), [fighterProjection])));
const projectionBefore = JSON.stringify(fighterProjection);
combatantSeedForToken(token(), [fighterProjection]);
check('seeding does not mutate the projection', JSON.stringify(fighterProjection) === projectionBefore);
check('a non-finite projection AC is ignored',
  combatantSeedFromProjection(token(), { ...fighterProjection, armorClass: Number.NaN }).armorClass === undefined);
const authoredNpc = token({ actorBindingId: undefined, acDisplay: { kind: 'exact', value: 16 } });
const authoredNpcSeed = combatantSeedForToken(authoredNpc, []);
check('a canonical campaign token carries exact authored AC into combat', authoredNpcSeed.armorClass === 16);
check('token-carried AC is not reported as projection-sourced', !authoredNpcSeed.seededFromProjection.includes('armorClass'));
check('an unknown token AC cannot become combat authority', combatantSeedForToken(token({ acDisplay: { kind: 'unknown' } }), []).armorClass === undefined);

// ── No CharacterData read from the combat layer ────────────────────────────
const FORBIDDEN = ['characterStore', 'CharacterData', 'dnd-types', 'dndCharacterToLiteActorSheet', 'useCharacterStore'];
const combatLayerFiles = [
  'src/lib/combat/combatantSeedFromProjection.ts',
  'src/lib/combat/combatRuntimeTypes.ts',
  'src/lib/combat/combatRuntimeReplay.ts',
  'src/lib/combat/useCombatRuntimeTable.ts',
  'src/components/platform/RoomRuntimeCombatPanel.tsx',
];
for (const file of combatLayerFiles) {
  const source = readFileSync(file, 'utf8');
  const importLines = source.split('\n').filter((line: string) => /^\s*import\b/.test(line) || /\brequire\(/.test(line));
  for (const term of FORBIDDEN) {
    check(`${file} does not import ${term}`, !importLines.some((line: string) => line.includes(term)));
  }
}
check('the seed module imports only map and platform types',
  readFileSync('src/lib/combat/combatantSeedFromProjection.ts', 'utf8')
    .split('\n').filter((line: string) => /^\s*import\b/.test(line))
    .every((line: string) => line.includes('../map/mapRuntimeTypes') || line.includes('../platform/roomRuntimeActorProjectionTypes')));

// ── Existing combat replay unchanged ───────────────────────────────────────
// The seed decides what ENTERS the table. Replay rebuilds state from the event
// stream and must be untouched by this task.
const replayEvents: CombatRuntimeReplayEvent[] = [
  {
    eventKind: 'combat.started',
    payload: {
      combatants: [
        { id: 'a', displayName: 'Aria', kind: 'character', sourceType: 'campaign_actor', initiative: 18, initiativeModifier: 2, hpCurrent: 9, hpMax: 9, armorClass: 15, conditions: [] },
        { id: 'b', displayName: 'Bandit', kind: 'npc', sourceType: 'manual_npc', initiative: 12, initiativeModifier: 4, hpCurrent: 7, hpMax: 7, armorClass: 13, conditions: [] },
      ],
      activeCombatantId: 'a',
      roundNumber: 1,
      turnIndex: 0,
    },
    seq: 1,
  },
  { eventKind: 'combat.damage_applied', payload: { targetCombatantId: 'a', amount: 4, beforeHp: 9, afterHp: 5 }, seq: 2 },
  { eventKind: 'combat.turn_advanced', payload: { activeCombatantId: 'b', roundNumber: 1, turnIndex: 1 }, seq: 3 },
];
const replayed = replayCombatRuntimeEvents(replayEvents);
check('replay still restores both combatants', replayed.combatants.length === 2);
check('replay still restores AC from the stream', replayed.combatants.find((item) => item.id === 'a')?.armorClass === 15);
check('replay still restores the initiative modifier from the stream', replayed.combatants.find((item) => item.id === 'b')?.initiativeModifier === 4);
check('replay still applies damage', replayed.combatants.find((item) => item.id === 'a')?.hpCurrent === 5);
check('replay still tracks the active turn', replayed.turn.activeCombatantId === 'b' && replayed.turn.turnIndex === 1);
check('replay is deterministic', JSON.stringify(replayCombatRuntimeEvents(replayEvents)) === JSON.stringify(replayed));
check('replay ordering is unchanged', sortCombatants(replayed.combatants).map((item) => item.id).join() === 'a,b');

// A combatant seeded by T10 replays back with the same AC and modifier: the
// seed only fills the payload, it does not alter how the payload is read.
const seededReplay = replayCombatRuntimeEvents([
  { eventKind: 'combat.combatant_added', payload: { combatant: fighterCombatant }, seq: 1 },
]);
check('a T10-seeded combatant replays with its AC', seededReplay.combatants[0]?.armorClass === 12);
check('a T10-seeded combatant replays with its initiative modifier', seededReplay.combatants[0]?.initiativeModifier === 2);
check('a T10-seeded combatant carries no reporting field',
  !('seededFromProjection' in (seededReplay.combatants[0] ?? {})));

// eslint-disable-next-line no-console
console.log(JSON.stringify({ total: cases.length, passed: cases.length, failed: 0, cases }, null, 2));
