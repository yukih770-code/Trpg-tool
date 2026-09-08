/**
 * Canonical room system-id registry smoke (P8 P0-A).
 *
 * AI-LANDMARK: ROOM_SYSTEM_REGISTRY_SMOKE_V1
 *
 * Pins the two validators that previously kept separate hand-copied lists —
 * room creation and live-room restart recovery — to one source, and asserts the
 * currently supported ids are preserved exactly.
 */

import {
  DEFAULT_ROOM_SYSTEM_ID,
  KNOWN_ROOM_SYSTEM_IDS,
  isKnownRoomSystemId,
  normalizeRoomSystemId,
} from './roomSystemRegistry';

const cases: string[] = [];
function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

// ── The supported set is preserved EXACTLY (no id added, none lost) ─────────
const expected = ['dnd5e-2024', 'coc7e', 'cp-red', 'custom'];
check('registry holds exactly the four previously supported ids',
  KNOWN_ROOM_SYSTEM_IDS.length === expected.length
  && expected.every((id) => (KNOWN_ROOM_SYSTEM_IDS as readonly string[]).includes(id)));
check('no duplicate ids', new Set(KNOWN_ROOM_SYSTEM_IDS).size === KNOWN_ROOM_SYSTEM_IDS.length);
check('default is unchanged from the previous inline literal', DEFAULT_ROOM_SYSTEM_ID === 'dnd5e-2024');
check('the default is itself a known id', isKnownRoomSystemId(DEFAULT_ROOM_SYSTEM_ID));

// ── Membership ─────────────────────────────────────────────────────────────
for (const id of expected) check(`"${id}" is accepted`, isKnownRoomSystemId(id));
for (const bad of ['', ' ', 'dnd', 'DND5E-2024', 'dnd5e', 'pathfinder2e', 'custom ', 'coc']) {
  check(`"${bad}" is refused`, !isKnownRoomSystemId(bad));
}
for (const bad of [undefined, null, 7, {}, [], true]) {
  check(`${JSON.stringify(bad) ?? 'undefined'} is refused`, !isKnownRoomSystemId(bad));
}

// ── normalize trims but never rewrites an unknown id into a supported one ───
check('normalize trims surrounding whitespace', normalizeRoomSystemId('  coc7e  ') === 'coc7e');
check('normalize returns undefined for an unknown id', normalizeRoomSystemId('pathfinder2e') === undefined);
check('normalize does NOT fall back to the default', normalizeRoomSystemId('nope') !== DEFAULT_ROOM_SYSTEM_ID);
check('normalize refuses a non-string', normalizeRoomSystemId(7) === undefined);
check('normalize is case sensitive', normalizeRoomSystemId('CoC7e') === undefined);

console.log(JSON.stringify({ status: 'passed', suite: 'roomSystemRegistry', assertions: cases.length }, null, 2));
