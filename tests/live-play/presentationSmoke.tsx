import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { RoomAttackResult } from '../../src/components/platform/RoomAttackResolutionDetails';
import { RuntimeCharacterSheetPanel, type RuntimeCharacterSummary } from '../../src/components/platform/RuntimeCharacterSheetPanel';
import { createCombatant } from '../../src/lib/combat/combatRuntimeTypes';
import type { RoomRuntimeLogEvent } from '../../src/lib/platform/roomRuntimeLogTypes';

const event = { eventId: 'attack', kind: 'combat.attack_resolved', payload: {
  resolution: { attackTotal: 23, outcome: 'hit', damageTotal: 9 },
} } as RoomRuntimeLogEvent;
const limited = renderToStaticMarkup(<RoomAttackResult event={event} />);
assert.ok(limited.includes('命中') && limited.includes('23') && limited.includes('9'));
assert.ok(!limited.includes('HP') && !limited.includes('AC'));
const exact = renderToStaticMarkup(<RoomAttackResult event={{ ...event, payload: {
  ...event.payload as object, privileged: { afterHp: 13, afterTemporaryHp: 2 },
} }} />);
assert.ok(exact.includes('HP') && exact.includes('13') && exact.includes('临时'));
const summary: RuntimeCharacterSummary = {
  displayName: 'Hero', coreStats: [{ label: '生命值 (HP)', value: '999 / 999' }, { label: '护甲等级 (AC)', value: '88' }],
  skillHighlights: [], resourceHighlights: [], featureHighlights: [], equipmentHighlights: [], notes: [], sourceWarnings: [],
};
const combatant = createCombatant({ id: 'pc', kind: 'character', initiativeModifier: 0, conditions: ['倒地'],
  hpDisplay: { kind: 'exact', current: 13, max: 28, temporary: 2 }, acDisplay: { kind: 'exact', value: 15 } });
const sheet = renderToStaticMarkup(<RuntimeCharacterSheetPanel summary={summary} liveCombatant={combatant} role="player" />);
assert.ok(sheet.includes('13/28') && sheet.includes('倒地'));
assert.ok(!sheet.includes('999') && !sheet.includes('88'));
const hiddenSheet = renderToStaticMarkup(<RuntimeCharacterSheetPanel summary={summary} liveCombatant={{ ...combatant, hpDisplay: { kind: 'unknown' }, acDisplay: { kind: 'unknown' } }} role="player" />);
assert.ok(!hiddenSheet.includes('999') && !hiddenSheet.includes('88') && !hiddenSheet.includes('13/28'));
console.log('Live play presentation: 6 checks passed; recorded outcomes, projection-gated state, current sheet vitals, no stale exact-value fallback.');
