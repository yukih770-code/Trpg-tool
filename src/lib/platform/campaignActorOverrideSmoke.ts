import { createDefaultDndLiteActorSheet } from '../dnd/dndLiteActorSheet';
import {
  DND_LITE_ACTOR_SHEET_OVERRIDE_KEY,
  projectDndLiteActorSheets,
  readDndLiteActorSheetOverride,
  withDndLiteActorSheetOverride,
  withoutDndLiteActorSheetOverride,
} from './campaignActorOverride';

const sheet = createDefaultDndLiteActorSheet({ displayName: 'Tamsin' });
const seeded = withDndLiteActorSheetOverride({ conditionNotes: ['blessed'] }, sheet);
const projected = projectDndLiteActorSheets([{
  campaignActorInstanceId: 'actor-1',
  campaignId: 'campaign-1',
  actorKind: 'pc',
  displayName: 'Tamsin',
  instanceStatus: 'active',
  snapshotPayload: {},
  overridePayload: seeded,
}]);
const invalid = readDndLiteActorSheetOverride({ [DND_LITE_ACTOR_SHEET_OVERRIDE_KEY]: { schemaVersion: 1 } });
const cleared = withoutDndLiteActorSheetOverride(seeded);

const checks = [
  readDndLiteActorSheetOverride(seeded)?.displayName === 'Tamsin',
  seeded.conditionNotes instanceof Array,
  projected['actor-1']?.displayName === 'Tamsin',
  invalid === undefined,
  !(DND_LITE_ACTOR_SHEET_OVERRIDE_KEY in cleared),
  cleared.conditionNotes instanceof Array,
];

if (checks.some((check) => !check)) throw new Error('Campaign actor override smoke failed.');
console.log(JSON.stringify({ status: 'passed', checks: checks.length }));
