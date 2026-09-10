import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { registerDndAttackRoutes } from './dndAttackHandlers.js';
import { t12Fixture } from '../services/t12TestFixture.js';
import { ResolvedIntentIndex } from '../services/resolvedIntentIndex.js';
import { readAuthoritativeCombat } from '../services/applyRuntimeResolution.js';
import { declareDndAttack } from '../services/declareDndAttack.js';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';

const f = t12Fixture(); let rng = 0; let broadcasts = 0; let storage = true;
const viewer = (id: string): CurrentViewerContext => ({ viewerUserId: id, isAuthenticated: Boolean(id), authTrustLevel: 'dev_header', isDevOnly: true, isServiceInternal: false, notes: [] });
const deps = { ...f, sessions: f.persistence, intents: new ResolvedIntentIndex(1), random: () => { rng++; return 0.5; },
  confirm: async (event: Parameters<typeof f.confirm>[0]) => storage ? f.confirm(event) : false };
const app = express(); app.use(express.json());
registerDndAttackRoutes(app, { ...deps, viewer: (req) => viewer(req.header('x-test-user') ?? ''), broadcast: () => { broadcasts++; } });
const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve) => server.once('listening', resolve));
const address = server.address(); assert.ok(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}/rooms/${f.room.identity.roomId}/runtime`;
async function post(body: Record<string, unknown>, user = 'player-user') {
  const response = await fetch(`${base}/dnd-attack`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-test-user': user }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() as any };
}
function fresh(extra = {}) { return { memberId: 'player', ...f.intent, intentId: randomUUID(), ...extra }; }
try {
  const authored = await fetch(`${base}/dnd-actions?memberId=host&actorCombatantId=npc`, { headers: { 'x-test-user': 'host-user' } });
  assert.equal(authored.status, 200); assert.equal((await authored.json() as any).actions[0].id, 'sword');
  const hostile = fresh({ attackBonus: 999, targetAc: 0, attackTotal: 999, outcome: 'miss', critical: true,
    damageFormula: '999d999', damageTotal: 999, amount: 999, beforeHp: 999, afterHp: 999, attackRawRolls: [20],
    controllerUserId: 'player-user', sourceActorInstanceId: 'npc-actor', resolvedByServer: true });
  const [a, b] = await Promise.all([post(hostile), post(hostile)]);
  assert.equal(a.status, 200); assert.equal(b.status, 200);
  assert.equal(a.body.event.eventId, b.body.event.eventId);
  assert.equal(rng, 2); assert.equal(broadcasts, 1); assert.equal(f.events.length, 1);
  assert.equal(a.body.event.payload.resolution.attackBonus, 5);
  assert.equal(a.body.event.payload.resolution.attackTotal, 16);
  assert.equal(a.body.event.payload.resolution.critical, false);
  assert.equal(a.body.event.payload.resolution.damageTotal, 8);
  assert.equal(a.body.event.payload.privileged.afterHp, 26);
  for (const changed of [{ actorCombatantId: 'npc' }, { targetCombatantId: 'pc' }, { actionId: 'other' }, { mode: 'advantage' }]) {
    const mismatch = await post({ ...hostile, ...changed }); assert.equal(mismatch.status, 409); assert.equal(mismatch.body.error, 'intent_reuse_mismatch');
  }
  assert.equal(rng, 2);
  const beforeDenied = rng;
  for (const [body, user, expected] of [
    [fresh({ memberId: 'other' }), 'other-user', 403],
    [fresh({ actorCombatantId: 'npc', controllerUserId: 'player-user' }), 'player-user', 403],
    [fresh({ memberId: 'absent' }), 'outsider', 403],
    [fresh({ memberId: 'host' }), 'player-user', 403],
    [fresh({ memberId: 'spectator' }), 'spectator-user', 403],
    [fresh(), '', 401],
    [fresh({ intentId: undefined }), 'player-user', 400],
    [fresh({ intentId: 'bad' }), 'player-user', 400],
    [fresh({ mode: 'super' }), 'player-user', 400],
    [fresh({ targetCombatantId: 'absent' }), 'player-user', 400],
    [fresh({ actionId: 'absent' }), 'player-user', 400],
  ] as const) assert.equal((await post(body, user)).status, expected);
  assert.equal(rng, beforeDenied);
  // A controller field inside authoritative replay is still not ownership.
  f.log.append(f.room.identity.roomId, { ...f.seed, eventId: randomUUID(), kind: 'combat.combatant_updated', payload: { combatant: { ...f.target, controllerUserId: 'player-user' } } });
  assert.equal((await post(fresh({ actorCombatantId: 'npc' }))).status, 403);
  const pc = f.actors.get('pc-actor')!;
  pc.campaignId = 'foreign'; assert.equal((await post(fresh())).status, 403); pc.campaignId = 'campaign';
  pc.ownerId = 'other-user'; assert.equal((await post(fresh())).status, 403); pc.ownerId = 'player-user';
  pc.archivedAt = 'archived'; assert.equal((await post(fresh())).status, 403); delete pc.archivedAt;
  // Update the current authoritative room through its registry API.
  const bindingRoom = f.rooms.get(f.room.identity.roomId)!;
  for (const status of ['pendingHostApproval', 'rejected'] as const) {
    bindingRoom.lobby!.actorBindings[0].status = status; f.rooms.update(bindingRoom.identity.roomId, () => bindingRoom);
    assert.equal((await post(fresh())).status, 403);
  }
  bindingRoom.lobby!.actorBindings[0].status = 'approved'; f.rooms.update(bindingRoom.identity.roomId, () => bindingRoom);
  const hostNpc = await post(fresh({ memberId: 'host', actorCombatantId: 'npc', targetCombatantId: 'pc' }), 'host-user');
  assert.equal(hostNpc.status, 200); assert.equal(hostNpc.body.event.actorBindingId, undefined);
  const priorRng = rng;
  pc.overridePayload = {}; // delayed retry must not read the changed action
  const retry = await post(hostile); assert.equal(retry.status, 200); assert.equal(retry.body.replayed, true); assert.equal(rng, priorRng);
  pc.overridePayload = f.actionPayload;
  for (const bad of ['archived', 'ended', 'foreign'] as const) {
    if (bad === 'archived') f.session.archivedAt = 'archived';
    else if (bad === 'ended') f.session.status = 'ended'; else f.session.campaignId = 'foreign';
    assert.equal((await post(fresh())).status, 409);
    delete f.session.archivedAt; f.session.status = 'active'; f.session.campaignId = 'campaign';
  }
  const archivedRoom = f.rooms.get(f.room.identity.roomId)!; archivedRoom.identity.lifecycleStatus = 'archived'; f.rooms.update(archivedRoom.identity.roomId, () => archivedRoom);
  assert.equal((await post(hostile)).status, 409);
  archivedRoom.identity.lifecycleStatus = 'open'; f.rooms.update(archivedRoom.identity.roomId, () => archivedRoom);
  const failed = fresh(); const priorBroadcasts = broadcasts; const count = f.log.list(f.room.identity.roomId).events.length;
  storage = false; assert.equal((await post(failed)).status, 503);
  assert.equal(broadcasts, priorBroadcasts); assert.equal(f.log.list(f.room.identity.roomId).events.length, count);
  storage = true; assert.equal((await post(failed)).status, 200);
  // Independent same-fingerprint intents serialize through confirmation, applying both.
  const hp = readAuthoritativeCombat(f.log, f.room.identity.roomId).combatants.find((c) => c.id === 'npc')!.hpCurrent!;
  await Promise.all([1, 2].map(() => declareDndAttack(deps, { roomId: f.room.identity.roomId, memberId: 'player', viewer: viewer('player-user'), body: fresh() })));
  assert.equal(readAuthoritativeCombat(f.log, f.room.identity.roomId).combatants.find((c) => c.id === 'npc')!.hpCurrent, Math.max(0, hp - 16));
  console.log('T12 HTTP/authority smoke passed: authenticated own PC, host NPC, hostile numbers, concurrent retries, all fingerprint fields, ownership/controller/campaign/binding guards, archived runtime, action reread bypass on retry and durability failure/no broadcast.');
} finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
