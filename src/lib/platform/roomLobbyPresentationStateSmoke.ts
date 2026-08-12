import { getRoomLobbyPresentationState } from './roomLobbyPresentationState';
import type { RoomSnapshot } from './roomTypes';

function expect(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const now = '2026-07-19T00:00:00.000Z';
const room: RoomSnapshot = {
  identity: { roomId: 'lobby-presentation', roomCode: 'LOBBY', serverId: 'local', systemId: 'dnd5e-2024', lifecycleStatus: 'open' },
  joinApprovalMode: 'hostApprovalRequired',
  members: [
    { memberId: 'host', displayName: 'Host', role: 'host', status: 'active' },
    { memberId: 'pending', displayName: 'Pending', role: 'player', status: 'pendingApproval' },
    { memberId: 'needs-character', displayName: 'Needs Character', role: 'player', status: 'active' },
    { memberId: 'review', displayName: 'Review', role: 'player', status: 'active' },
    { memberId: 'approved', displayName: 'Approved', role: 'player', status: 'active' },
    { memberId: 'ready', displayName: 'Ready', role: 'player', status: 'active' },
    { memberId: 'spectator', displayName: 'Spectator', role: 'spectator', status: 'active' },
  ],
  actorBindings: [],
  invites: [],
  lobby: {
    actorBindings: [
      { bindingId: 'review', memberId: 'review', actorRef: { systemId: 'dnd5e-2024', displayName: 'Review', source: 'quickDraft' }, status: 'pendingHostApproval', submittedAt: now },
      { bindingId: 'approved', memberId: 'approved', actorRef: { systemId: 'dnd5e-2024', displayName: 'Approved', source: 'quickDraft' }, status: 'approved', submittedAt: now, clearance: { admissionId: 'approved', status: 'approved', updatedAt: now } },
      { bindingId: 'ready', memberId: 'ready', actorRef: { systemId: 'dnd5e-2024', displayName: 'Ready', source: 'quickDraft' }, status: 'approved', submittedAt: now, clearance: { admissionId: 'ready', status: 'approved', updatedAt: now } },
    ],
    readyStates: [{ memberId: 'ready', status: 'ready', updatedAt: now }],
  },
};

const checks = [
  ['pending stays outside the lobby actions', 'pending', 'player_waiting_room_approval', false, false, false],
  ['needs character has actions', 'needs-character', 'player_needs_character', true, false, false],
  ['review keeps character replacement available', 'review', 'player_waiting_character_review', true, false, false],
  ['approved keeps character replacement available', 'approved', 'player_approved_needs_ready', true, true, false],
  ['ready keeps character replacement available', 'ready', 'player_ready_can_enter', true, true, true],
  ['spectator has no character pressure', 'spectator', 'spectator_can_enter', false, false, true],
  ['host sees review queue and optional character entry', 'host', 'host_ready_to_manage', true, false, true],
].map(([name, memberId, kind, character, ready, runtime]) => {
  try {
    const result = getRoomLobbyPresentationState({ room, memberId: String(memberId), canEnterRuntime: true });
    expect(result.kind === kind, `${name}: expected ${kind}, got ${result.kind}`);
    expect(result.canShowCharacterEntry === character, `${name}: character action mismatch`);
    expect(result.canShowReadyAction === ready, `${name}: ready action mismatch`);
    expect(result.canShowRuntimeEntry === runtime, `${name}: runtime action mismatch`);
    expect(!/本地占位|主持占位|binding|admission|clearance/i.test(`${result.stateLabel} ${result.primaryMessage}`), `${name}: internal wording leaked`);
    return { name, passed: true };
  } catch (error) {
    return { name, passed: false, error: error instanceof Error ? error.message : String(error) };
  }
});

const failed = checks.filter((check) => !check.passed);
console.log(JSON.stringify({ total: checks.length, passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
if (failed.length) process.exitCode = 1;
