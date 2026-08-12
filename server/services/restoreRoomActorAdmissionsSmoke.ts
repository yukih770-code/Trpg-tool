import { createInMemoryActorAdmissionRegistry } from '../actor-admission-registry.js';
import { createInMemoryRoomRegistry } from '../room-registry.js';
import { approveActorBinding } from './approveActorBinding.js';
import { createRoom } from './createRoom.js';
import { restoreRoomActorAdmissions } from './restoreRoomActorAdmissions.js';
import { setMemberReady } from './setMemberReady.js';
import { submitActorBinding } from './submitActorBinding.js';

function main(): void {
  const registry = createInMemoryRoomRegistry();
  const admissions = createInMemoryActorAdmissionRegistry();
  const room = createRoom({
    hostDisplayName: 'Host',
    hostUserId: 'host-user',
    sessionId: 'session-1',
    campaignRef: {
      source: 'unknown',
      worldServerId: 'world-1',
      campaignId: 'campaign-1',
      displayName: 'Campaign',
      systemId: 'dnd5e-2024',
    },
  }).room;
  const host = room.members[0];
  const player = {
    ...host,
    memberId: 'player-member',
    userId: 'player-user',
    displayName: 'Player',
    role: 'player' as const,
    status: 'active' as const,
  };
  registry.create({ ...room, members: [...room.members, player] });
  const submitted = submitActorBinding(registry, {
    roomId: room.identity.roomId,
    memberId: player.memberId,
    actorRef: { displayName: 'Durable Hero', source: 'quickDraft' },
  });
  if (!submitted.bindingId) throw new Error('Admission restore fixture submission failed.');
  const approved = approveActorBinding(registry, admissions, {
    roomId: room.identity.roomId,
    bindingId: submitted.bindingId,
    reviewerMemberId: host.memberId,
  });
  if (approved.decision !== 'approved') throw new Error('Admission restore fixture approval failed.');

  const durableRoom = registry.get(room.identity.roomId);
  if (!durableRoom) throw new Error('Admission restore fixture room missing.');
  const restoredAdmissions = createInMemoryActorAdmissionRegistry();
  const restored = restoreRoomActorAdmissions(durableRoom, restoredAdmissions);
  const duplicate = restoreRoomActorAdmissions(durableRoom, restoredAdmissions);
  const restoredRoomRegistry = createInMemoryRoomRegistry();
  restoredRoomRegistry.create(durableRoom);
  const ready = setMemberReady(restoredRoomRegistry, restoredAdmissions, {
    roomId: room.identity.roomId,
    memberId: player.memberId,
    ready: true,
  });

  const malformedRoom = JSON.parse(JSON.stringify(durableRoom)) as typeof durableRoom;
  const malformed = malformedRoom.lobby?.actorBindings[0];
  if (malformed?.clearance?.snapshotHash) malformed.clearance.snapshotHash.value = 'not-a-sha256-hash';
  const malformedAdmissions = createInMemoryActorAdmissionRegistry();
  const malformedRestore = restoreRoomActorAdmissions(malformedRoom, malformedAdmissions);

  const checks = [
    restored.restoredCount === 1 && restored.skippedCount === 0,
    approved.admissionId !== undefined && restoredAdmissions.get(approved.admissionId)?.status === 'approved',
    restoredAdmissions.listByBinding(submitted.bindingId).length === 1,
    duplicate.restoredCount === 0 && duplicate.skippedCount === 1,
    ready.decision === 'updated' && ready.room?.lobby?.readyStates.some((state) => state.memberId === player.memberId && state.status === 'ready'),
    malformedRestore.restoredCount === 0 && malformedRestore.skippedCount === 1,
  ];
  if (checks.some((check) => !check)) throw new Error('Room actor admission restore smoke failed.');
  console.log(JSON.stringify({ status: 'passed', checks: checks.length }));
}

main();
