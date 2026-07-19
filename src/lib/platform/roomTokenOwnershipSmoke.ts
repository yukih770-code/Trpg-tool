import { createMapToken } from '../map/mapRuntimeTypes';
import { isTokenLinkedToApprovedRoomMember } from './roomTokenOwnership';
import type { RoomSnapshot } from './roomTypes';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const room: RoomSnapshot = {
  identity: { roomId: 'room-token-ownership', roomCode: 'OWNED', serverId: 'local', systemId: 'dnd5e-2024', lifecycleStatus: 'open' },
  joinApprovalMode: 'hostApprovalRequired',
  members: [
    { memberId: 'host', displayName: 'Host', role: 'host', status: 'active' },
    { memberId: 'player-a', displayName: 'Player A', role: 'player', status: 'active' },
    { memberId: 'player-b', displayName: 'Player B', role: 'player', status: 'active' },
    { memberId: 'spectator', displayName: 'Spectator', role: 'spectator', status: 'active' },
  ],
  actorBindings: [],
  invites: [],
  lobby: {
    actorBindings: [
      { bindingId: 'binding-a', memberId: 'player-a', actorRef: { systemId: 'dnd5e-2024', displayName: 'Ariadne', source: 'localActorVault' }, status: 'approved', submittedAt: '2026-07-19T00:00:00.000Z', clearance: { admissionId: 'admission-a', status: 'approved', updatedAt: '2026-07-19T00:00:00.000Z' } },
      { bindingId: 'binding-b', memberId: 'player-b', actorRef: { systemId: 'dnd5e-2024', displayName: 'Borin', source: 'localActorVault' }, status: 'approved', submittedAt: '2026-07-19T00:00:00.000Z', clearance: { admissionId: 'admission-b', status: 'approved', updatedAt: '2026-07-19T00:00:00.000Z' } },
    ],
    readyStates: [],
  },
};

const ownToken = createMapToken({ id: 'token-a', name: 'Ariadne', x: 20, y: 20, size: 'medium', sourceType: 'roomActorBinding', sourceId: 'binding-a', actorBindingId: 'binding-a', roomMemberId: 'player-a', kind: 'playerCharacter' });
const otherToken = createMapToken({ ...ownToken, id: 'token-b', sourceId: 'binding-b', actorBindingId: 'binding-b', roomMemberId: 'player-b' });
const manualToken = createMapToken({ id: 'manual', name: 'Marker', x: 40, y: 40, size: 'medium', sourceType: 'manual', kind: 'object' });
const spoofedOwnerToken = createMapToken({ ...otherToken, id: 'spoofed-owner', ownerUserId: 'user-a', controlledByUserId: 'user-a' });

const cases: Array<{ name: string; run: () => void }> = [
  { name: 'approved player recognizes own binding token', run: () => expect(isTokenLinkedToApprovedRoomMember(room, 'player-a', ownToken), 'own approved token was not recognized') },
  { name: 'player does not recognize another binding token', run: () => expect(!isTokenLinkedToApprovedRoomMember(room, 'player-a', otherToken), 'other player token was recognized') },
  { name: 'manual host token is not player controlled', run: () => expect(!isTokenLinkedToApprovedRoomMember(room, 'player-a', manualToken), 'manual token was recognized') },
  { name: 'owner metadata alone grants nothing', run: () => expect(!isTokenLinkedToApprovedRoomMember(room, 'player-a', spoofedOwnerToken), 'spoofed owner metadata was trusted') },
  { name: 'spectator has no approved player token', run: () => expect(!isTokenLinkedToApprovedRoomMember(room, 'spectator', ownToken), 'spectator gained token control') },
];

const results = cases.map((test) => {
  try { test.run(); return { name: test.name, passed: true }; }
  catch (error) { return { name: test.name, passed: false, error: error instanceof Error ? error.message : String(error) }; }
});
const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, cases: results }, null, 2));
if (failed.length) process.exitCode = 1;
