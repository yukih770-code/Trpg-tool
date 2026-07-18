import { linkedTokenForCandidate, toMapTokenPrototype } from '../map/actorPresence';
import { createMapToken } from '../map/mapRuntimeTypes';
import {
  entryCharacterFromCampaignSuggestedActor,
  entryCharacterFromRoomBinding,
  entryCharacterToPresenceCandidate,
  placeableEntryCharacterCandidates,
} from './entryCharacterRef';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const carried = entryCharacterFromCampaignSuggestedActor(
  { actorId: 'actor-heat', actorName: '热' },
  { systemId: 'dnd5e-2024', ownerUserId: 'user-host', isHostCarried: true },
);
const localDraft = entryCharacterFromCampaignSuggestedActor(
  { actorId: 'actor-draft', actorName: '草稿角色' },
  { systemId: 'dnd5e-2024' },
);
const approvedBinding = entryCharacterFromRoomBinding({
  bindingId: 'binding-heat',
  memberId: 'member-player',
  actorRef: { systemId: 'dnd5e-2024', actorId: 'actor-heat', displayName: '热', source: 'localActorVault' },
  status: 'approved',
  submittedAt: '2026-07-18T00:00:00.000Z',
  clearance: { admissionId: 'admission-heat', status: 'approved', updatedAt: '2026-07-18T00:00:00.000Z' },
}, { memberId: 'member-player', userId: 'user-player', displayName: '玩家', role: 'player', status: 'active' });

const candidates = placeableEntryCharacterCandidates([carried!, localDraft!, approvedBinding!]);
const approvedCandidate = entryCharacterToPresenceCandidate(approvedBinding!);
const approvedToken = createMapToken({ id: 'token-heat', ...toMapTokenPrototype(approvedCandidate!, { x: 40, y: 40 }) });

const cases: Array<{ name: string; run: () => void }> = [
  { name: 'campaign suggested actor normalizes', run: () => assert(carried?.displayName === '热' && carried.isLocalDraft, 'suggested actor did not normalize') },
  { name: 'host carried actor becomes placeable', run: () => assert(candidates.some((candidate) => candidate.displayName === '热' && candidate.sourceType === 'vaultActor'), 'host carried actor missing') },
  { name: 'local draft is selected but not admitted', run: () => assert(localDraft?.isLocalDraft && !candidates.some((candidate) => candidate.displayName === '草稿角色'), 'local draft was treated as admitted') },
  { name: 'approved room binding becomes placeable', run: () => assert(approvedBinding?.isApprovedForRoom && approvedCandidate?.sourceType === 'roomActorBinding', 'approved room binding missing') },
  { name: 'no character remains a safe empty state', run: () => assert(placeableEntryCharacterCandidates([]).length === 0, 'empty presence changed') },
  { name: 'normalized candidate locates an existing token', run: () => assert(linkedTokenForCandidate([approvedToken], approvedCandidate!)?.id === 'token-heat', 'normalized candidate did not locate token') },
];

const failed = cases.flatMap((test) => {
  try { test.run(); return []; } catch (error) { return [{ name: test.name, error: error instanceof Error ? error.message : String(error) }]; }
});

console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases, notes: ['EntryCharacterRef is a normalization layer only; it does not grant room permission or token movement.'] }, null, 2));
if (failed.length) process.exitCode = 1;
