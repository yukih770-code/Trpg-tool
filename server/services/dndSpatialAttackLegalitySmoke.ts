import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTokenSpatialFootprintV1 } from '../../src/lib/map/tokenSpatialFootprint.js';
import { DND_2024_GRID_CELL_DISTANCE_FEET } from '../../src/lib/dnd2024/gameplay/dndWeaponRangeSource.js';
import { declareDndAttack } from './declareDndAttack.js';
import { RuntimeResolutionError, readAuthoritativeCombat } from './applyRuntimeResolution.js';
import { ResolvedIntentIndex } from './resolvedIntentIndex.js';
import { t12Fixture } from './t12TestFixture.js';
import express from 'express';
import { registerDndAttackRoutes } from '../api/dndAttackHandlers.js';

const ACTION_ID = 'action.item.dagger.melee-weapon-attack';
const MAP_ID = 'spatial-map';
const footprint = createTokenSpatialFootprintV1({ width: 1, height: 1 });

function configured(options: { scene?: boolean; attackerFootprint?: boolean; targetFootprint?: boolean; targetX?: number } = {}) {
  const f = t12Fixture();
  f.actors.get('pc-actor')!.overridePayload = { dndLiteActorSheetV1: { schemaVersion: 1, actions: [{
    id: ACTION_ID, name: 'Authoritative dagger', kind: 'weapon_attack', attackBonus: 5, damageFormula: '1d4+3', damageType: 'piercing',
  }] } };
  const roomId = f.room.identity.roomId;
  const appendCombatant = (combatant: typeof f.actor, mapTokenId: string) => f.log.append(roomId, {
    eventId: randomUUID(), roomId, createdAt: new Date().toISOString(), authorMemberId: 'host', kind: 'combat.combatant_updated',
    visibility: 'public', campaignRef: f.room.campaignRef, payload: { combatant: { ...combatant, mapTokenId } },
  });
  appendCombatant(f.actor, 'actor-token');
  appendCombatant(f.target, 'target-token');
  const appendMap = (eventKind: 'map.spatial_updated' | 'map.token_added' | 'map.token_moved', payload: Record<string, unknown>, mapId = MAP_ID) =>
    f.maps.append(roomId, { mapEventId: randomUUID(), roomId, mapId, createdAt: new Date().toISOString(), authorMemberId: 'host', eventKind, payload });
  if (options.scene !== false) appendMap('map.spatial_updated', { spatial: {
    schemaVersion: 1, coordinateSystem: 'normalized-100', tokenAnchor: 'center', world: { width: 10, height: 10 },
    grid: { kind: 'square', originX: 0, originY: 0, cellSize: 1 },
    scale: { unitsPerGridCell: DND_2024_GRID_CELL_DISTANCE_FEET, unitLabel: 'ft' },
  } });
  appendMap('map.token_added', { token: { id: 'actor-token', name: 'Actor', x: 5, y: 5, size: 'medium',
    sourceType: 'combatant', sourceActorInstanceId: 'pc-actor', combatantId: 'pc',
    footprint: options.attackerFootprint === false ? undefined : footprint } });
  appendMap('map.token_added', { token: { id: 'target-token', name: 'Target', x: options.targetX ?? 25, y: 5, size: 'medium',
    sourceType: 'combatant', sourceActorInstanceId: 'npc-actor', combatantId: 'npc',
    footprint: options.targetFootprint === false ? undefined : footprint } });
  let rng = 0;
  const deps = { ...f, sessions: f.persistence, intents: new ResolvedIntentIndex(), random: () => { rng++; return 0.5; } };
  const attack = (extras: Record<string, unknown> = {}) => declareDndAttack(deps, { roomId, memberId: 'player',
    viewer: { viewerUserId: 'player-user', isAuthenticated: true, authTrustLevel: 'dev_header', isDevOnly: true, isServiceInternal: false, notes: [] },
    body: { memberId: 'player', intentId: randomUUID(), actorCombatantId: 'pc', targetCombatantId: 'npc', actionId: ACTION_ID, mode: 'normal', ...extras },
  });
  return { f, roomId, appendMap, attack, deps, rng: () => rng };
}

const ranged = configured();
const beforeEvents = ranged.f.log.list(ranged.roomId).events.length;
const beforeHp = readAuthoritativeCombat(ranged.f.log, ranged.roomId).combatants.find((item) => item.id === 'npc')!.hpCurrent;
await assert.rejects(ranged.attack({ attackerCoordinates: { x: 5, y: 5 }, targetCoordinates: { x: 15, y: 5 },
  distance: 0, reach: 999, footprint, bounds: {}, distanceProfile: { reach: 999 } }),
  (error: unknown) => error instanceof RuntimeResolutionError && error.code === 'dnd_attack_out_of_range' && error.status === 409);
assert.equal(ranged.rng(), 0, 'illegal attack consumes no RNG');
assert.equal(ranged.f.log.list(ranged.roomId).events.length, beforeEvents, 'illegal attack emits no RuntimeLog event');
assert.equal(readAuthoritativeCombat(ranged.f.log, ranged.roomId).combatants.find((item) => item.id === 'npc')!.hpCurrent, beforeHp,
  'illegal attack does not mutate HP');
ranged.appendMap('map.token_moved', { tokenId: 'target-token', x: 15, y: 5 });
await ranged.attack();
assert.ok(ranged.rng() > 0, 'legal adjacent attack reaches existing T12 RNG');

for (const unavailable of [
  configured({ scene: false, targetX: 25 }),
  configured({ attackerFootprint: false, targetX: 25 }),
  configured({ targetFootprint: false, targetX: 25 }),
]) {
  await unavailable.attack();
  assert.ok(unavailable.rng() > 0, 'unavailable spatial authority preserves GM-adjudicated T12');
}

const unsupported = configured({ targetX: 25 });
unsupported.f.actors.get('pc-actor')!.overridePayload = { dndLiteActorSheetV1: { schemaVersion: 1, actions: [{
  id: 'gm-action', name: 'GM override', kind: 'weapon_attack', attackBonus: 5, damageFormula: '1d4+3',
}] } };
await unsupported.attack({ actionId: 'gm-action' });
assert.ok(unsupported.rng() > 0, 'unsupported/manual override action remains GM-adjudicated');

const http = configured({ targetX: 25 });
const app = express();
app.use(express.json());
registerDndAttackRoutes(app, { ...http.deps,
  viewer: () => ({ viewerUserId: 'player-user', isAuthenticated: true, authTrustLevel: 'dev_header', isDevOnly: true, isServiceInternal: false, notes: [] }),
  broadcast: () => assert.fail('illegal attack must not broadcast'),
});
const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve) => server.once('listening', resolve));
try {
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const response = await fetch(`http://127.0.0.1:${address.port}/rooms/${http.roomId}/runtime/dnd-attack`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      memberId: 'player', intentId: randomUUID(), actorCombatantId: 'pc', targetCombatantId: 'npc', actionId: ACTION_ID, mode: 'normal',
    }),
  });
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: 'dnd_attack_out_of_range' });
  assert.equal(http.rng(), 0);
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

console.log('D&D spatial attack authority smoke passed: canonical legal/illegal, pre-RNG rejection, no HP/log mutation, hostile spatial fields ignored, and no-scene/point-only/unsupported fallback.');
