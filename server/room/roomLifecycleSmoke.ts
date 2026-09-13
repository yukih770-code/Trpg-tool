import { createInMemoryActorAdmissionRegistry } from '../actor-admission-registry.js';
import { createInMemoryRoomMapRegistry } from '../room-map-registry.js';
import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createInMemoryRuntimeLogRegistry } from '../runtime-log-registry.js';
import { approveMember } from '../services/approveMember.js';
import { appendRoomMapEvent } from '../services/appendRoomMapEvent.js';
import { appendRuntimeLogEvent } from '../services/appendRuntimeLogEvent.js';
import { createRoom } from '../services/createRoom.js';
import { disbandRoom } from '../services/disbandRoom.js';
import { joinRoom } from '../services/joinRoom.js';
import { rollSharedDice } from '../services/rollSharedDice.js';
import { setMemberReady } from '../services/setMemberReady.js';
import { submitActorBinding } from '../services/submitActorBinding.js';
import { resolveRoomRuntimePermission } from './roomRuntimePermissionGuard.js';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';

function expect(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function viewer(userId: string): CurrentViewerContext {
  return { viewerUserId: userId, isAuthenticated: true, authTrustLevel: 'dev_header', isDevOnly: true, isServiceInternal: false, notes: [] };
}

const rooms = createInMemoryRoomRegistry();
const maps = createInMemoryRoomMapRegistry();
const logs = createInMemoryRuntimeLogRegistry();
const admissions = createInMemoryActorAdmissionRegistry();
const created = createRoom({ hostDisplayName: 'Host', hostUserId: 'host-user' });
rooms.create(created.room);
const roomId = created.room.identity.roomId;
const hostMemberId = created.room.members[0]?.memberId;
expect(hostMemberId, 'host must exist');

const joined = joinRoom(rooms, { inviteCodeOrRoomCode: created.room.identity.roomCode, requestedDisplayName: 'Player', requestedRole: 'player', userId: 'player-user' });
expect(joined.memberId, 'player should join before the lifecycle test');
expect(approveMember(rooms, { roomId, memberId: joined.memberId, decidedByMemberId: hostMemberId }).decision === 'approved', 'host should approve player');
const playerMemberId = joined.memberId;
const recoveredJoin = joinRoom(rooms, { inviteCodeOrRoomCode: created.room.identity.roomCode, requestedDisplayName: 'Player after reload', requestedRole: 'spectator', userId: 'player-user' });
expect(recoveredJoin.decision === 'accepted' && recoveredJoin.memberId === playerMemberId && rooms.get(roomId)?.members.length === 2, 'same authenticated user duplicated its room membership');

expect(appendRuntimeLogEvent(rooms, logs, { roomId, authorMemberId: hostMemberId, kind: 'host.note', visibility: 'public', text: 'Preserved history' }).decision === 'appended', 'history event should append before disband');
expect(appendRoomMapEvent(rooms, maps, { roomId, authorMemberId: hostMemberId, mapId: 'main', eventKind: 'map.grid_updated', payload: { enabled: true } }).decision === 'appended', 'map history should append before disband');
const historyCount = logs.list(roomId).events.length;
const mapHistoryCount = maps.list(roomId).events.length;

const checks = [
  { name: 'non-host cannot disband', run: () => expect(disbandRoom(rooms, { roomId, decidedByMemberId: playerMemberId }).decision === 'memberNotHost', 'player disband was allowed') },
  { name: 'host disbands without deleting history', run: () => {
    const result = disbandRoom(rooms, { roomId, decidedByMemberId: hostMemberId });
    expect(result.decision === 'disbanded' && result.room?.identity.lifecycleStatus === 'closed', 'host did not close room');
    expect(logs.list(roomId).events.length === historyCount, 'runtime history was deleted');
    expect(maps.list(roomId).events.length === mapHistoryCount, 'map history was deleted');
  } },
  { name: 'closed room rejects new join', run: () => expect(joinRoom(rooms, { inviteCodeOrRoomCode: created.room.identity.roomCode, requestedDisplayName: 'Late', userId: 'late-user' }).decision === 'roomClosed', 'closed room accepted join') },
  { name: 'closed room blocks ready', run: () => expect(setMemberReady(rooms, admissions, { roomId, memberId: playerMemberId, ready: true }).decision === 'roomClosed', 'closed room accepted ready') },
  { name: 'closed room blocks actor submission', run: () => expect(submitActorBinding(rooms, { roomId, memberId: playerMemberId, actorRef: { displayName: 'Late actor' } }).decision === 'roomClosed', 'closed room accepted binding') },
  { name: 'closed room blocks map mutation', run: () => expect(appendRoomMapEvent(rooms, maps, { roomId, authorMemberId: hostMemberId, mapId: 'main', eventKind: 'map.grid_updated', payload: { enabled: false } }).decision === 'roomClosed', 'closed room accepted map mutation') },
  { name: 'closed room blocks runtime log and dice', run: () => {
    expect(appendRuntimeLogEvent(rooms, logs, { roomId, authorMemberId: hostMemberId, kind: 'host.note', text: 'Late event' }).decision === 'roomClosed', 'closed room appended RuntimeLog');
    expect(rollSharedDice(rooms, logs, { roomId, memberId: hostMemberId, expression: '1d20' }).decision === 'roomClosed', 'closed room rolled dice');
  } },
  { name: 'closed room blocks authoritative runtime permission', run: () => {
    const room = rooms.get(roomId);
    expect(room, 'closed room disappeared from registry');
    expect(resolveRoomRuntimePermission({ room, viewer: viewer('host-user'), memberId: hostMemberId, action: 'room.host.manage' }).code === 'room_closed', 'closed room retained runtime authority');
  } },
];

const results = checks.map((check) => {
  try { check.run(); return { name: check.name, passed: true }; }
  catch (error) { return { name: check.name, passed: false, error: error instanceof Error ? error.message : String(error) }; }
});
const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, checks: results }, null, 2));
if (failed.length) process.exitCode = 1;
