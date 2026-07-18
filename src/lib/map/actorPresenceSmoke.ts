import { createCombatant } from '../combat/combatRuntimeTypes';
import { resolveRoomRuntimePermissions } from '../platform/roomRuntimePermissions';
import { createSceneRuntimeSnapshot, importSceneRuntimeSnapshot } from '../scene/sceneRuntimeSnapshot';
import { campaignActorPresenceCandidate, combatantPresenceCandidate, linkedTokenForCandidate, toMapTokenPrototype, tokenInitials, tokenWithCombatProjection } from './actorPresence';
import { replayMapRuntimeEvents } from './mapRuntimeReplay';
import { createMapBoardState, createMapToken } from './mapRuntimeTypes';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

const hero = campaignActorPresenceCandidate({ campaignActorInstanceId: 'actor-1', displayName: 'Ariadne', actorKind: 'pc', ownerId: 'user-a' });
const monster = { sourceType: 'monsterTemplate' as const, sourceId: 'monster-1', displayName: 'Cave beast', kind: 'monster' as const };
const dndLite = { sourceType: 'dndLiteActor' as const, sourceId: 'actor-2', campaignActorId: 'actor-2', displayName: 'Rook', kind: 'playerCharacter' as const };
const combatant = createCombatant({ id: 'combat-1', displayName: 'Ariadne', kind: 'character', sourceType: 'campaign_actor', sourceActorInstanceId: 'actor-1', controllerUserId: 'user-a', initiativeModifier: 2, hpCurrent: 12, hpMax: 20, temporaryHp: 3, conditions: ['Blessed'] });
const combatCandidate = combatantPresenceCandidate(combatant);
const heroToken = createMapToken({ id: 'token-hero', ...toMapTokenPrototype(hero, { x: 50, y: 50 }) });
const combatToken = createMapToken({ id: 'token-combat', ...toMapTokenPrototype(combatCandidate, { x: 55, y: 55 }) });

const cases: Array<{ name: string; run: () => void }> = [
  { name: 'old manual token still works', run: () => assert(createMapToken({ id: 'legacy', name: 'Marker', x: 1, y: 2, size: 'medium', sourceType: 'manual' }).name === 'Marker', 'manual token changed') },
  { name: 'old map token event replays', run: () => assert(replayMapRuntimeEvents([{ eventKind: 'map.token_added', payload: { token: { id: 'legacy', name: 'Marker', x: 1, y: 2, size: 'medium', sourceType: 'manual' } } }], 'map').tokens.length === 1, 'legacy event failed') },
  { name: 'campaign actor creates map token', run: () => assert(heroToken.campaignActorId === 'actor-1' && heroToken.kind === 'playerCharacter', 'campaign actor metadata missing') },
  { name: 'DND Lite actor creates map token', run: () => assert(toMapTokenPrototype(dndLite, { x: 0, y: 0 }).sourceType === 'dndLiteActor', 'DND Lite prototype missing') },
  { name: 'monster template creates map token', run: () => assert(toMapTokenPrototype(monster, { x: 0, y: 0 }).kind === 'monster', 'monster prototype missing') },
  { name: 'combatant creates linked token', run: () => assert(combatToken.combatantId === 'combat-1', 'combat link missing') },
  { name: 'duplicate linked token is detected', run: () => assert(linkedTokenForCandidate([heroToken], hero)?.id === heroToken.id, 'duplicate link not detected') },
  { name: 'linked token can be located', run: () => assert(linkedTokenForCandidate([combatToken], combatCandidate)?.id === 'token-combat', 'linked token cannot be located') },
  { name: 'linked token stores source metadata', run: () => assert(heroToken.sourceId === 'actor-1' && heroToken.ownerUserId === 'user-a', 'source metadata missing') },
  { name: 'replay restores source metadata', run: () => assert(replayMapRuntimeEvents([{ eventKind: 'map.token_added', payload: { token: heroToken } }], 'map').tokens[0]?.campaignActorId === 'actor-1', 'metadata not replayed') },
  { name: 'scene snapshot preserves source metadata', run: () => { const map = createMapBoardState('map'); map.tokens = [combatToken]; const imported = importSceneRuntimeSnapshot(createSceneRuntimeSnapshot({ map, exportedAt: '2026-07-18T00:00:00.000Z' })); assert(imported.ok && imported.snapshot.map?.board.tokens[0]?.combatantId === 'combat-1', 'snapshot lost combat link'); } },
  { name: 'missing image falls back to initials', run: () => assert(tokenInitials('Ariadne Vale') === 'AV' && tokenInitials('') === '?', 'initial fallback changed') },
  { name: 'combat summary projects onto linked token', run: () => { const projected = tokenWithCombatProjection(combatToken, [combatant]); assert(projected.hpSummary?.current === 12 && projected.conditionSummary?.[0] === 'Blessed', 'combat projection stale'); } },
  { name: 'host can move every token', run: () => assert(resolveRoomRuntimePermissions({ authenticated: true, roomMemberActive: true, roomRole: 'host' })['map.token.move'], 'host move unexpectedly denied') },
  { name: 'player cannot move unowned token', run: () => assert(!resolveRoomRuntimePermissions({ authenticated: true, roomMemberActive: true, roomRole: 'player' })['map.token.move'], 'player token move must remain disabled') },
  { name: 'ownership hint cannot grant player movement', run: () => assert(!resolveRoomRuntimePermissions({ authenticated: true, roomMemberActive: true, roomRole: 'player' })['map.token.move'], 'ownership hint granted movement') },
  { name: 'old snapshot without metadata imports safely', run: () => { const map = createMapBoardState('map'); map.tokens = [createMapToken({ id: 'old', name: 'Old', x: 10, y: 10, size: 'medium', sourceType: 'manual' })]; const imported = importSceneRuntimeSnapshot(createSceneRuntimeSnapshot({ map, exportedAt: '2026-07-18T00:00:00.000Z' })); assert(imported.ok && !imported.snapshot.map?.board.tokens[0]?.sourceId, 'old snapshot changed'); } },
];

const results = cases.map((test) => { try { test.run(); return { name: test.name, passed: true }; } catch (error) { return { name: test.name, passed: false, error: error instanceof Error ? error.message : String(error) }; } });
const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, cases: results, notes: ['Actor presence metadata is a frontend projection. It does not grant token movement or replace server room permission checks.'] }, null, 2));
if (failed.length) process.exitCode = 1;
