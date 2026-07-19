import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createInMemoryRuntimeLogRegistry } from '../runtime-log-registry.js';
import { createRoom } from '../services/createRoom.js';
import { joinRoom } from '../services/joinRoom.js';
import { approveMember } from '../services/approveMember.js';
import { appendRuntimeLogEvent } from '../services/appendRuntimeLogEvent.js';

function check(name: string, condition: boolean): void {
  if (!condition) throw new Error(`failed: ${name}`);
  checks.push(name);
}

const checks: string[] = [];
const rooms = createInMemoryRoomRegistry();
const log = createInMemoryRuntimeLogRegistry();
const created = createRoom({ hostDisplayName: 'Host', hostUserId: 'host-user' });
rooms.create(created.room);
const roomId = created.room.identity.roomId;
const hostMemberId = created.room.members[0]?.memberId;
if (!hostMemberId) throw new Error('host member was not created');
const joined = joinRoom(rooms, { inviteCodeOrRoomCode: created.room.identity.roomCode, requestedDisplayName: 'Player', requestedRole: 'player', userId: 'player-user' });
if (!joined.memberId) throw new Error('player member was not created');
approveMember(rooms, { roomId, memberId: joined.memberId, decidedByMemberId: hostMemberId });

const hostResult = appendRuntimeLogEvent(rooms, log, {
  roomId,
  authorMemberId: hostMemberId,
  kind: 'combat.started',
  visibility: 'public',
  payload: { roundNumber: 1, turnIndex: 0, activeCombatantId: 'hero', combatants: [] },
});
check('host can persist a combat state transition', hostResult.decision === 'appended');

const playerResult = appendRuntimeLogEvent(rooms, log, {
  roomId,
  authorMemberId: joined.memberId,
  kind: 'combat.turn_advanced',
  visibility: 'public',
  payload: { roundNumber: 1, turnIndex: 1, activeCombatantId: 'goblin' },
});
check('approved player cannot advance the shared combat state', playerResult.decision === 'memberNotAuthorized');
check('combat RuntimeLog remains append-only', log.list(roomId).events.length === 1 && log.list(roomId).events[0]?.kind === 'combat.started');

console.log(JSON.stringify({ total: checks.length, passed: checks.length, failed: 0, checks }, null, 2));
