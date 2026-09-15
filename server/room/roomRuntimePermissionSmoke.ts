import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createRoom } from '../services/createRoom.js';
import { joinRoom } from '../services/joinRoom.js';
import { approveMember } from '../services/approveMember.js';
import { setMemberReady } from '../services/setMemberReady.js';
import { setRoomMapMemberPermission } from '../services/setRoomMapMemberPermission.js';
import { createInMemoryActorAdmissionRegistry } from '../actor-admission-registry.js';
import { resolveRoomParticipant, resolveRoomRuntimePermission } from './roomRuntimePermissionGuard.js';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function viewer(userId: string | null): CurrentViewerContext {
  return {
    viewerUserId: userId,
    isAuthenticated: userId !== null,
    authTrustLevel: userId ? 'dev_header' : 'anonymous',
    isDevOnly: userId !== null,
    isServiceInternal: false,
    notes: [],
  };
}

const registry = createInMemoryRoomRegistry();
const admissions = createInMemoryActorAdmissionRegistry();
const created = createRoom({ hostDisplayName: 'Host', hostUserId: 'user_host' });
registry.create(created.room);
const roomId = created.room.identity.roomId;
const hostMemberId = created.room.members[0]?.memberId;
expect(hostMemberId, 'room creation must create the authenticated host member');
expect(
  setMemberReady(registry, admissions, { roomId, memberId: hostMemberId, ready: true }).decision === 'updated',
  'active host should be able to ready without a character binding',
);

const joined = joinRoom(registry, {
  inviteCodeOrRoomCode: created.room.identity.roomCode,
  requestedDisplayName: 'Player',
  requestedRole: 'player',
  userId: 'user_player',
});
expect(joined.memberId && joined.roomId, 'player join should create a pending participant');
const playerMemberId = joined.memberId;
const pendingRoom = registry.get(roomId);
expect(pendingRoom, 'room should remain available while player approval is pending');
expect(
  !resolveRoomParticipant({ room: pendingRoom, viewer: viewer('user_player'), memberId: playerMemberId }).allowed,
  'pending applicant must use the narrow join-status endpoint instead of receiving a room snapshot',
);
approveMember(registry, { roomId, memberId: playerMemberId, decidedByMemberId: hostMemberId });
const room = registry.get(roomId);
expect(room, 'room should remain available after approval');

expect(resolveRoomParticipant({ room, viewer: viewer('user_player'), memberId: playerMemberId }).allowed, 'authenticated player should subscribe to their own lobby');
expect(!resolveRoomParticipant({ room, viewer: viewer('user_other'), memberId: playerMemberId }).allowed, 'another user must not claim the player member id');
expect(!resolveRoomRuntimePermission({ room, viewer: viewer('user_player'), memberId: playerMemberId, action: 'map.template.fix' }).allowed, 'player must not pin a range without an explicit grant');
expect(!resolveRoomRuntimePermission({ room, viewer: viewer('user_player'), memberId: playerMemberId, action: 'map.token.move.own' }).allowed, 'player must not move a token without an explicit host grant');
expect(resolveRoomRuntimePermission({ room, viewer: viewer('user_player'), memberId: playerMemberId, action: 'map.preview.range.temporary' }).allowed, 'active player should share temporary previews');
expect(!resolveRoomRuntimePermission({ room, viewer: viewer(null), memberId: hostMemberId, action: 'map.grid.edit' }).allowed, 'anonymous LAN-like caller must not gain host control');

const grant = setRoomMapMemberPermission(registry, {
  roomId,
  authorizedByMemberId: hostMemberId,
  memberId: playerMemberId,
  canPinRanges: true,
});
expect(grant.decision === 'updated', 'host should grant one room-session fixed-range capability');
const grantedRoom = registry.get(roomId);
expect(grantedRoom, 'granted room should be present');
expect(resolveRoomRuntimePermission({ room: grantedRoom, viewer: viewer('user_player'), memberId: playerMemberId, action: 'map.template.fix' }).allowed, 'explicit grant should allow only fixed range creation');
expect(!resolveRoomRuntimePermission({ room: grantedRoom, viewer: viewer('user_player'), memberId: playerMemberId, action: 'map.template.edit' }).allowed, 'fixed-range grant must not allow editing existing templates');

const movementGrant = setRoomMapMemberPermission(registry, {
  roomId,
  authorizedByMemberId: hostMemberId,
  memberId: playerMemberId,
  canManageTokens: true,
});
expect(movementGrant.decision === 'updated', 'host should grant narrow own-token movement');
const movementGrantedRoom = registry.get(roomId);
expect(movementGrantedRoom, 'movement-granted room should be present');
expect(resolveRoomRuntimePermission({ room: movementGrantedRoom, viewer: viewer('user_player'), memberId: playerMemberId, action: 'map.token.move.own' }).allowed, 'explicit grant should allow own-token movement');
expect(!resolveRoomRuntimePermission({ room: movementGrantedRoom, viewer: viewer('user_player'), memberId: playerMemberId, action: 'map.token.move.any' }).allowed, 'own-token grant must not allow broad token movement');
expect(!resolveRoomRuntimePermission({ room: movementGrantedRoom, viewer: viewer('user_player'), memberId: playerMemberId, action: 'map.token.update.any' }).allowed, 'own-token movement grant must not allow authoritative footprint edits');

const revoke = setRoomMapMemberPermission(registry, {
  roomId,
  authorizedByMemberId: hostMemberId,
  memberId: playerMemberId,
  canPinRanges: false,
});
expect(revoke.decision === 'updated', 'host should revoke the room-session range capability');
const revokedRoom = registry.get(roomId);
expect(revokedRoom, 'revoked room should be present');
expect(!resolveRoomRuntimePermission({ room: revokedRoom, viewer: viewer('user_player'), memberId: playerMemberId, action: 'map.template.fix' }).allowed, 'revoked player must no longer fix map ranges');

// eslint-disable-next-line no-console
console.log('Room runtime permission smoke passed: authenticated member binding, grant/revoke, and LAN non-authority.');
