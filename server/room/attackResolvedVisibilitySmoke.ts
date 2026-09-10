import assert from 'node:assert/strict';
import { t12Fixture } from '../services/t12TestFixture.js';
import { resolveDndAttackAction } from '../services/resolveDndAttackAction.js';
import { applyRuntimeResolution } from '../services/applyRuntimeResolution.js';
import { projectRuntimeLogEventsForViewer } from './roomRuntimeVisibilityProjection.js';
import { projectAttackResolvedFacts } from './projectAttackResolvedFacts.js';
import type { Combatant } from '../../src/lib/combat/combatRuntimeTypes.js';
import type { RoomMapEvent } from '../protocol/room-protocol.js';

const f = t12Fixture();
const proposal = resolveDndAttackAction({ target: f.target, actionPayload: f.actionPayload, intent: f.intent, resolutionId: 'resolution', random: () => 0.5 });
proposal.publicFacts.secret = 'must not pass'; proposal.privilegedFacts.secret = 'must not pass';
const event = await applyRuntimeResolution({ ...f, proposal, confirm: f.confirm, context: {
  roomId: f.room.identity.roomId, memberId: 'player', sessionId: 'session', intentId: f.intent.intentId,
  fingerprint: 'fingerprint', actorCombatantId: 'pc', targetCombatantId: 'npc', expectedSeq: 1,
} });
for (const memberId of ['host', 'player', 'other', 'spectator']) {
  const projected = projectRuntimeLogEventsForViewer(f.room, memberId, f.log.list(f.room.identity.roomId).events, []).at(-1)!;
  const payload = projected.payload as { combatants: Combatant[]; resolution: Record<string, unknown>; privileged?: Record<string, unknown>; mutations?: unknown };
  const target = payload.combatants.find((c) => c.id === 'npc')!;
  assert.equal(target.hpDisplay?.kind, 'exact', 'HEAD policy unchanged');
  assert.equal(target.acDisplay?.kind, 'exact');
  assert.equal(payload.privileged?.targetAc, 15);
  assert.equal(payload.privileged?.beforeHp, 30);
  assert.equal(payload.privileged?.afterHp, 26);
  assert.equal(payload.privileged?.beforeTemporaryHp, 4);
  assert.equal(payload.privileged?.afterTemporaryHp, target.hpDisplay.kind === 'exact' ? target.hpDisplay.temporary ?? 0 : undefined);
  assert.equal(payload.privileged?.amount, 4);
  assert.equal(payload.privileged?.absorbedByTemporaryHp, 4);
  assert.equal(payload.resolution.damageTotal, 8);
  assert.equal(payload.mutations, undefined);
  assert.ok(!JSON.stringify(payload).includes('must not pass'));
  assert.equal(projected.text, 'Attack: 16, hit. 8 damage rolled.');
}
const linkedHistory = [{ ...f.seed, payload: { ...(f.seed.payload as Record<string, unknown>),
  combatants: [f.actor, { ...f.target, mapTokenId: 'owned-target' }],
} }, event];
const maps: RoomMapEvent[] = [{ mapEventId: 'map-owner', roomId: f.room.identity.roomId, mapId: 'map', seq: 1,
  createdAt: f.seed.createdAt, authorMemberId: 'host', eventKind: 'map.token_added', payload: { token: {
    id: 'owned-target', name: 'Target', x: 0, y: 0, size: 'medium', sourceType: 'roomActorBinding',
    kind: 'playerCharacter', roomMemberId: 'other', actorBindingId: 'other-binding',
  } },
}];
for (const memberId of ['host', 'player', 'other', 'spectator']) {
  const p = projectRuntimeLogEventsForViewer(f.room, memberId, linkedHistory, maps).at(-1)!.payload as {
    combatants: Combatant[]; privileged: Record<string, unknown>;
  };
  const target = p.combatants.find((c) => c.id === 'npc')!;
  assert.equal(target.visibility, memberId === 'host' ? 'hostFull' : memberId === 'other' ? 'ownerFull' : 'publicShared');
  assert.equal(p.privileged.targetAc, target.acDisplay?.kind === 'exact' ? target.acDisplay.value : undefined);
  assert.equal(p.privileged.afterHp, target.hpDisplay?.kind === 'exact' ? target.hpDisplay.current : undefined);
  assert.equal(p.privileged.afterTemporaryHp, target.hpDisplay?.kind === 'exact' ? target.hpDisplay.temporary ?? 0 : undefined);
}
const raw = event.payload as Record<string, unknown>;
for (const hpDisplay of [{ kind: 'unknown' as const }, { kind: 'stage' as const, stage: 'wounded' as const }]) {
  const limited = projectAttackResolvedFacts(raw, { hpDisplay, acDisplay: { kind: 'unknown' } });
  assert.equal(limited.privileged, undefined);
  assert.equal((limited.resolution as Record<string, unknown>).damageTotal, 8);
}
const acOnly = projectAttackResolvedFacts(raw, { hpDisplay: { kind: 'unknown' }, acDisplay: { kind: 'exact', value: 15 } });
assert.deepEqual(acOnly.privileged, { targetAc: 15 });
const hpOnly = projectAttackResolvedFacts(raw, { hpDisplay: { kind: 'exact', current: 26 }, acDisplay: { kind: 'unknown' } });
assert.deepEqual(hpOnly.privileged, { beforeHp: 30, afterHp: 26 }, 'exact HP alone grants no temp HP fields or applied amount');
const tempOnly = projectAttackResolvedFacts(raw, { hpDisplay: { kind: 'exact', temporary: 0 }, acDisplay: { kind: 'unknown' } });
assert.deepEqual(tempOnly.privileged, { beforeTemporaryHp: 4, afterTemporaryHp: 0, absorbedByTemporaryHp: 4 });
const maxOnly = projectAttackResolvedFacts(raw, { hpDisplay: { kind: 'exact', max: 30 }, acDisplay: { kind: 'unknown' } });
assert.equal(maxOnly.privileged, undefined);
assert.equal(projectAttackResolvedFacts(raw).privileged, undefined);
assert.deepEqual(projectRuntimeLogEventsForViewer(f.room, 'absent', [event], []), []);
console.log('T12 visibility smoke passed: current host/player/spectator policy, explicit allowlist, restricted/unknown target, independent AC gating and conservative text.');
