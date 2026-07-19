import { describeRoomPlayerFlow, describeTokenControlHint } from './roomPlayerFlow';
import type { RoomSnapshot } from './roomTypes';

function expect(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const now = '2026-07-19T00:00:00.000Z';
const room: RoomSnapshot = {
  identity: { roomId: 'player-flow', roomCode: 'FLOW', serverId: 'local', systemId: 'dnd5e-2024', lifecycleStatus: 'open' },
  joinApprovalMode: 'hostApprovalRequired',
  members: [
    { memberId: 'host', displayName: 'Host', role: 'host', status: 'active' },
    { memberId: 'no-character', displayName: 'No Character', role: 'player', status: 'active' },
    { memberId: 'submitted', displayName: 'Submitted', role: 'player', status: 'active' },
    { memberId: 'rejected', displayName: 'Rejected', role: 'player', status: 'active' },
    { memberId: 'approved', displayName: 'Approved', role: 'player', status: 'active' },
    { memberId: 'ready', displayName: 'Ready', role: 'player', status: 'active' },
    { memberId: 'spectator', displayName: 'Spectator', role: 'spectator', status: 'active' },
    { memberId: 'pending', displayName: 'Pending', role: 'player', status: 'pendingApproval' },
  ],
  actorBindings: [],
  invites: [],
  lobby: {
    actorBindings: [
      { bindingId: 'submitted', memberId: 'submitted', actorRef: { systemId: 'dnd5e-2024', displayName: 'Submitted', source: 'quickDraft' }, status: 'pendingHostApproval', submittedAt: now },
      { bindingId: 'rejected', memberId: 'rejected', actorRef: { systemId: 'dnd5e-2024', displayName: 'Rejected', source: 'quickDraft' }, status: 'rejected', rejectionReason: '请补充摘要', submittedAt: now },
      { bindingId: 'approved', memberId: 'approved', actorRef: { systemId: 'dnd5e-2024', displayName: 'Approved', source: 'localActorVault' }, status: 'approved', submittedAt: now, clearance: { admissionId: 'admitted', status: 'approved', updatedAt: now } },
      { bindingId: 'ready', memberId: 'ready', actorRef: { systemId: 'dnd5e-2024', displayName: 'Ready', source: 'localActorVault' }, status: 'approved', submittedAt: now, clearance: { admissionId: 'admitted-ready', status: 'approved', updatedAt: now } },
    ],
    readyStates: [{ memberId: 'ready', status: 'ready', updatedAt: now }],
  },
};

const expected: Array<[string, ReturnType<typeof describeRoomPlayerFlow>['state']]> = [
  ['no-character', 'chooseCharacter'],
  ['submitted', 'waitingForHostReview'],
  ['rejected', 'characterRejected'],
  ['approved', 'waitingForReady'],
  ['ready', 'readyToEnter'],
  ['spectator', 'spectator'],
  ['host', 'host'],
  ['pending', 'waitingForMembership'],
];

const results = expected.map(([memberId, state]) => {
  try {
    const flow = describeRoomPlayerFlow(room, memberId);
    expect(flow.state === state, `${memberId} expected ${state}, got ${flow.state}`);
    expect(flow.detail.length > 0 && flow.nextAction.length > 0, `${memberId} is missing guidance`);
    return { name: `${memberId} shows ${state}`, passed: true };
  } catch (error) {
    return { name: `${memberId} shows ${state}`, passed: false, error: error instanceof Error ? error.message : String(error) };
  }
});
results.push(...[
  { name: 'own token gets movable hint', run: () => expect(describeTokenControlHint({ locale: 'zh', isHost: false, hasSelectedToken: true, canMoveSelectedToken: true, hasControlledBinding: true, hasControlledToken: true }) === '你的角色，可移动。', 'own token hint changed') },
  { name: 'ungranted or other token gets host-control hint', run: () => expect(describeTokenControlHint({ locale: 'zh', isHost: false, hasSelectedToken: true, canMoveSelectedToken: false, hasControlledBinding: true, hasControlledToken: true }) === '该 Token 由主持人控制，或尚未授权移动。', 'host control hint changed') },
  { name: 'unplaced admitted character gets wait hint', run: () => expect(describeTokenControlHint({ locale: 'zh', isHost: false, hasSelectedToken: false, canMoveSelectedToken: false, hasControlledBinding: true, hasControlledToken: false })?.includes('尚未被放置') === true, 'unplaced token hint changed') },
].map((test) => {
  try { test.run(); return { name: test.name, passed: true }; }
  catch (error) { return { name: test.name, passed: false, error: error instanceof Error ? error.message : String(error) };
  }
}));
const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, cases: results }, null, 2));
if (failed.length) process.exitCode = 1;
