import { createInMemoryActorAdmissionRegistry } from '../actor-admission-registry.js';
import { createInMemoryRoomMapRegistry } from '../room-map-registry.js';
import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createRoom } from '../services/createRoom.js';
import { joinRoom } from '../services/joinRoom.js';
import { approveMember } from '../services/approveMember.js';
import { submitActorBinding } from '../services/submitActorBinding.js';
import { approveActorBinding } from '../services/approveActorBinding.js';
import { appendRoomMapEvent } from '../services/appendRoomMapEvent.js';
import { resolveVerifiedRoomTokenMove } from './roomTokenControlGuard.js';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function viewer(viewerUserId: string | null): CurrentViewerContext {
  return { viewerUserId, isAuthenticated: viewerUserId !== null, authTrustLevel: viewerUserId ? 'dev_header' : 'anonymous', isDevOnly: viewerUserId !== null, isServiceInternal: false, notes: [] };
}

const rooms = createInMemoryRoomRegistry();
const maps = createInMemoryRoomMapRegistry();
const admissions = createInMemoryActorAdmissionRegistry();
const created = createRoom({ hostDisplayName: 'Host', hostUserId: 'user-host', systemId: 'dnd5e-2024' });
rooms.create(created.room);
const roomId = created.room.identity.roomId;
const mapId = 'token-control-map';
const hostMemberId = created.room.members[0]?.memberId;
expect(hostMemberId, 'host member should exist');

function addActiveMember(name: string, role: 'player' | 'spectator', userId: string): string {
  const joined = joinRoom(rooms, { inviteCodeOrRoomCode: created.room.identity.roomCode, requestedDisplayName: name, requestedRole: role, userId });
  expect(joined.memberId, `${name} should join`);
  expect(approveMember(rooms, { roomId, memberId: joined.memberId, decidedByMemberId: hostMemberId }).decision === 'approved', `${name} should be approved`);
  return joined.memberId;
}

function approveBinding(memberId: string, actorId: string, displayName: string): string {
  const submitted = submitActorBinding(rooms, { roomId, memberId, actorRef: { actorId, displayName, source: 'localActorVault' } });
  expect(submitted.decision === 'submitted' && submitted.bindingId, `${displayName} binding should submit`);
  const approved = approveActorBinding(rooms, admissions, { roomId, bindingId: submitted.bindingId, reviewerMemberId: hostMemberId });
  expect(approved.decision === 'approved', `${displayName} binding should be approved`);
  return submitted.bindingId;
}

const playerA = addActiveMember('Player A', 'player', 'user-a');
const playerB = addActiveMember('Player B', 'player', 'user-b');
const spectator = addActiveMember('Spectator', 'spectator', 'user-spectator');
const pending = joinRoom(rooms, { inviteCodeOrRoomCode: created.room.identity.roomCode, requestedDisplayName: 'Pending', requestedRole: 'player', userId: 'user-pending' }).memberId;
expect(pending, 'pending member should exist');
const bindingA = approveBinding(playerA, 'actor-a', 'Ariadne');
const bindingB = approveBinding(playerB, 'actor-b', 'Borin');

function hostAdd(id: string, token: Record<string, unknown>): void {
  const result = appendRoomMapEvent(rooms, maps, { roomId, authorMemberId: hostMemberId, mapId, eventKind: 'map.token_added', payload: { token: { id, x: 20, y: 20, size: 'medium', ...token } } });
  expect(result.decision === 'appended', `host should place ${id}`);
}

hostAdd('token-a', { name: 'Ariadne', sourceType: 'roomActorBinding', sourceId: bindingA, actorBindingId: bindingA, roomMemberId: playerA, kind: 'playerCharacter' });
hostAdd('token-vault', { name: 'Ariadne vault', sourceType: 'vaultActor', sourceId: 'actor-a', actorBindingId: bindingA, roomMemberId: playerA, kind: 'playerCharacter' });
hostAdd('token-draft', { name: 'Ariadne draft', sourceType: 'quickDraft', sourceId: 'actor-a', actorBindingId: bindingA, roomMemberId: playerA, kind: 'playerCharacter' });
hostAdd('token-lite', { name: 'Ariadne lite', sourceType: 'dndLiteActor', sourceId: 'actor-a', actorBindingId: bindingA, roomMemberId: playerA, kind: 'playerCharacter' });
hostAdd('token-campaign', { name: 'Ariadne campaign', sourceType: 'campaign_actor', sourceId: 'actor-a', actorBindingId: bindingA, roomMemberId: playerA, kind: 'playerCharacter' });
hostAdd('token-b', { name: 'Borin', sourceType: 'roomActorBinding', sourceId: bindingB, actorBindingId: bindingB, roomMemberId: playerB, kind: 'playerCharacter' });
hostAdd('token-monster', { name: 'Monster', sourceType: 'monsterTemplate', sourceId: 'monster-1', kind: 'monster' });
hostAdd('token-manual', { name: 'Marker', sourceType: 'manual', kind: 'object' });
hostAdd('token-spoofed', { name: 'Borin', sourceType: 'roomActorBinding', sourceId: bindingB, actorBindingId: bindingB, roomMemberId: playerB, kind: 'playerCharacter', ownerUserId: 'user-a', controlledByUserId: 'user-a' });
hostAdd('token-no-member', { name: 'Old Token', sourceType: 'vaultActor', sourceId: 'actor-a', actorBindingId: bindingA, kind: 'playerCharacter' });
hostAdd('token-spoofed-binding', { name: 'Ariadne', sourceType: 'vaultActor', sourceId: 'actor-a', actorBindingId: bindingB, roomMemberId: playerA, kind: 'playerCharacter' });

function movePayload(tokenId: string) { return { tokenId, x: 33, y: 44 }; }
function verify(userId: string | null, memberId: string, payload: unknown) {
  const room = rooms.get(roomId);
  expect(room, 'room should exist');
  return resolveVerifiedRoomTokenMove({ room, mapRegistry: maps, viewer: viewer(userId), memberId, mapId, payload });
}

const cases: Array<{ name: string; run: () => void }> = [
  { name: 'host can move any token', run: () => expect(verify('user-host', hostMemberId, movePayload('token-monster')).allowed, 'host move denied') },
  { name: 'approved player can move own token', run: () => expect(verify('user-a', playerA, movePayload('token-a')).allowed, 'own token move denied') },
  { name: 'approved player can move own vault token linked to binding', run: () => expect(verify('user-a', playerA, movePayload('token-vault')).allowed, 'vault token move denied') },
  { name: 'approved player can move own quick draft token linked to binding', run: () => expect(verify('user-a', playerA, movePayload('token-draft')).allowed, 'quick draft token move denied') },
  { name: 'approved player can move own DND Lite token linked to binding', run: () => expect(verify('user-a', playerA, movePayload('token-lite')).allowed, 'DND Lite token move denied') },
  { name: 'approved player can move own campaign actor token linked to binding', run: () => expect(verify('user-a', playerA, movePayload('token-campaign')).allowed, 'campaign token move denied') },
  { name: 'approved player cannot move another player token', run: () => expect(!verify('user-a', playerA, movePayload('token-b')).allowed, 'other token move allowed') },
  { name: 'approved player cannot move monster token', run: () => expect(!verify('user-a', playerA, movePayload('token-monster')).allowed, 'monster move allowed') },
  { name: 'approved player cannot move manual host token', run: () => expect(!verify('user-a', playerA, movePayload('token-manual')).allowed, 'manual move allowed') },
  { name: 'pending member cannot move token', run: () => expect(!verify('user-pending', pending, movePayload('token-a')).allowed, 'pending move allowed') },
  { name: 'spectator cannot move token', run: () => expect(!verify('user-spectator', spectator, movePayload('token-a')).allowed, 'spectator move allowed') },
  { name: 'spoofed owner user id grants nothing', run: () => expect(!verify('user-a', playerA, movePayload('token-spoofed')).allowed, 'spoofed owner granted movement') },
  { name: 'old token without room member metadata remains host controlled', run: () => expect(!verify('user-a', playerA, movePayload('token-no-member')).allowed, 'old token move allowed') },
  { name: 'spoofed binding id is rejected', run: () => expect(!verify('user-a', playerA, movePayload('token-spoofed-binding')).allowed, 'spoofed binding move allowed') },
  { name: 'spoofed member id is rejected', run: () => expect(!verify('user-a', playerB, movePayload('token-b')).allowed, 'spoofed member accepted') },
  { name: 'malformed token move is rejected safely', run: () => expect(verify('user-a', playerA, { tokenId: 'token-a', x: 'bad', y: 30 }).code === 'invalidMove', 'malformed move was not rejected') },
  { name: 'null token move payload is rejected safely', run: () => expect(verify('user-a', playerA, null).code === 'invalidMove', 'null move payload was not rejected') },
  { name: 'verified player move appends through room map service', run: () => expect(appendRoomMapEvent(rooms, maps, { roomId, authorMemberId: playerA, mapId, eventKind: 'map.token_moved', payload: movePayload('token-a') }).decision === 'appended', 'verified player move did not append') },
];

const results = cases.map((test) => {
  try { test.run(); return { name: test.name, passed: true }; }
  catch (error) { return { name: test.name, passed: false, error: error instanceof Error ? error.message : String(error) }; }
});
const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, cases: results, notes: ['Token metadata is cross-checked against active approved room bindings; trusted viewer-to-member validation is required on HTTP and WebSocket authority paths.'] }, null, 2));
if (failed.length) process.exitCode = 1;
