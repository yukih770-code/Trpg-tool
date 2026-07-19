import { entryCharacterFromRoomBinding, placeableEntryCharacterCandidates } from './entryCharacterRef';
import { evaluateRoomRuntimeEntryEligibility } from './roomRuntimeEntryGuard';
import type { RoomSnapshot } from './roomTypes';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const now = '2026-07-18T00:00:00.000Z';
const approvedBinding = {
  bindingId: 'binding-player',
  memberId: 'member-player',
  actorRef: {
    systemId: 'dnd5e-2024' as const,
    actorId: 'actor-local',
    displayName: 'Ariadne',
    source: 'localActorVault' as const,
    summary: 'Local vault character',
    hpCurrent: 12,
    hpMax: 18,
    armorClass: 15,
  },
  status: 'approved' as const,
  submittedAt: now,
  clearance: { admissionId: 'admission-player', status: 'approved' as const, updatedAt: now },
};

const room: RoomSnapshot = {
  identity: { roomId: 'room-clearance', roomCode: 'CLEAR', serverId: 'local', systemId: 'dnd5e-2024', lifecycleStatus: 'open' },
  joinApprovalMode: 'hostApprovalRequired',
  members: [
    { memberId: 'member-host', displayName: 'Host', role: 'host', status: 'active' },
    { memberId: 'member-player', displayName: 'Player', role: 'player', status: 'active' },
    { memberId: 'member-spectator', displayName: 'Spectator', role: 'spectator', status: 'active' },
    { memberId: 'member-unbound', displayName: 'Unbound', role: 'player', status: 'active' },
  ],
  actorBindings: [],
  invites: [],
  lobby: {
    actorBindings: [approvedBinding],
    readyStates: [{ memberId: 'member-player', status: 'ready', updatedAt: now }],
  },
};

const cases: Array<{ name: string; run: () => void }> = [
  {
    name: 'unbound player cannot enter runtime',
    run: () => assert(!evaluateRoomRuntimeEntryEligibility(room, 'member-unbound').canEnter, 'unbound player entered runtime'),
  },
  {
    name: 'approved and ready player can enter runtime',
    run: () => assert(evaluateRoomRuntimeEntryEligibility(room, 'member-player').entryMode === 'playerReady', 'approved player was blocked'),
  },
  {
    name: 'host can enter without a character binding',
    run: () => assert(evaluateRoomRuntimeEntryEligibility(room, 'member-host').entryMode === 'hostPreview', 'host required a character'),
  },
  {
    name: 'spectator enters only spectator preview',
    run: () => assert(evaluateRoomRuntimeEntryEligibility(room, 'member-spectator').entryMode === 'spectatorPreview', 'spectator entry changed'),
  },
  {
    name: 'admitted binding carries entry preview and map candidate data',
    run: () => {
      const entry = entryCharacterFromRoomBinding(approvedBinding, room.members[1]);
      const candidate = placeableEntryCharacterCandidates(entry ? [entry] : [])[0];
      assert(candidate?.displayName === 'Ariadne' && candidate.hpSummary?.max === 18, 'entry preview was not preserved');
    },
  },
];

const results = cases.map((test) => {
  try {
    test.run();
    return { name: test.name, passed: true };
  } catch (error) {
    return { name: test.name, passed: false, error: error instanceof Error ? error.message : String(error) };
  }
});
const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, cases: results }, null, 2));
if (failed.length > 0) process.exitCode = 1;
