import { evaluateRoomRuntimeEntryEligibility } from './roomRuntimeEntryGuard';
import { getRoomLobbyPresentationState } from './roomLobbyPresentationState';
import { isRoomVisibleInActiveList } from './roomLifecycle';
import type { RoomSnapshot } from './roomTypes';

function expect(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const activeRoom: RoomSnapshot = {
  identity: { roomId: 'active', roomCode: 'ACTIVE', serverId: 'local', systemId: 'dnd5e-2024', lifecycleStatus: 'open' },
  joinApprovalMode: 'hostApprovalRequired',
  members: [{ memberId: 'host', displayName: 'Host', role: 'host', status: 'active' }],
  actorBindings: [],
  invites: [],
};
const closedRoom: RoomSnapshot = {
  ...activeRoom,
  identity: { ...activeRoom.identity, roomId: 'closed', roomCode: 'CLOSED', lifecycleStatus: 'closed' },
  joinApprovalMode: 'closed',
};

const checks = [
  { name: 'active room remains discoverable', run: () => expect(isRoomVisibleInActiveList(activeRoom.identity.lifecycleStatus), 'open room was hidden') },
  { name: 'closed room is hidden from active discovery', run: () => expect(!isRoomVisibleInActiveList(closedRoom.identity.lifecycleStatus), 'closed room was visible') },
  { name: 'archived room is hidden from active discovery', run: () => expect(!isRoomVisibleInActiveList('archived'), 'archived room was visible') },
  { name: 'closed room shows product-facing lobby state', run: () => {
    const presentation = getRoomLobbyPresentationState({ room: closedRoom, memberId: 'host', canEnterRuntime: false });
    expect(presentation.kind === 'room_closed', `expected room_closed, got ${presentation.kind}`);
    expect(!presentation.canShowCharacterEntry && !presentation.canShowReadyAction && !presentation.canShowRuntimeEntry, 'closed lobby exposed an action');
    expect(presentation.primaryMessage.includes('不再开放加入'), 'closed lobby wording is unclear');
  } },
  { name: 'closed room blocks runtime entry', run: () => expect(evaluateRoomRuntimeEntryEligibility(closedRoom, 'host').reason === 'roomClosed', 'closed room entered runtime') },
];

const results = checks.map((check) => {
  try { check.run(); return { name: check.name, passed: true }; }
  catch (error) { return { name: check.name, passed: false, error: error instanceof Error ? error.message : String(error) }; }
});
const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, checks: results }, null, 2));
if (failed.length) process.exitCode = 1;
