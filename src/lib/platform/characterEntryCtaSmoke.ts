import { strict as assert } from 'node:assert';
import { getCharacterEntryActions } from './characterEntryCta';

const playerActions = getCharacterEntryActions('player').map((action) => action.id);
assert.deepEqual(playerActions, ['existing', 'quickDraft', 'fullSheet', 'spectator']);

const pendingActions = getCharacterEntryActions(undefined).map((action) => action.id);
assert.deepEqual(pendingActions, ['existing', 'quickDraft', 'fullSheet', 'spectator']);

const hostActions = getCharacterEntryActions('host').map((action) => action.id);
assert.deepEqual(hostActions, ['existing', 'quickDraft', 'fullSheet', 'skipHostCharacter']);
assert.ok(!hostActions.includes('spectator'));

console.log('character entry CTA smoke passed');
