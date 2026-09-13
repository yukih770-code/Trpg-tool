/**
 * Quick actor preset smoke.
 *
 * AI-LANDMARK: DND_ACTOR_PRESETS_SMOKE_V1
 *
 * Covers materialization, the T12 action contract, preset/custom detection,
 * reset, provenance round-tripping, and the boundaries this feature must not
 * cross (no second sheet schema, no live template inheritance, no T13/T14).
 */

import {
  DND_ACTOR_PRESET_DEFINITION_VERSION,
  DND_ACTOR_PRESET_IDS,
  DND_ACTOR_PRESET_PROVENANCE,
  compareDndActorPresetState,
  dndActorPresetQuickDraftValues,
  getDndActorPreset,
  listDndActorPresets,
  materializeDndActorPreset,
  resetSheetToDndActorPreset,
} from './dndActorPresets';
import { calculateDndAbilityModifier, validateDndLiteActorSheet } from './dndLiteActorSheet';
import { parseDndDiceFormula } from './dndDiceRoller';
import {
  DND_ACTOR_PRESET_OVERRIDE_KEY,
  DND_LITE_ACTOR_SHEET_OVERRIDE_KEY,
  readDndActorPresetProvenance,
  readDndLiteActorSheetOverride,
  withDndActorPresetProvenance,
  withDndLiteActorSheetOverride,
  withoutDndLiteActorSheetOverride,
} from '../platform/campaignActorOverride';

const cases: string[] = [];
function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

// ── 1. provenance is labelled, and labelled as project-defined ──────────────
check('presets declare homebrew provenance', DND_ACTOR_PRESET_PROVENANCE.source === 'homebrew'
  && DND_ACTOR_PRESET_PROVENANCE.trustLevel === 'homebrew');
check('presets are usable at runtime', DND_ACTOR_PRESET_PROVENANCE.usagePolicy === 'core-runtime-ok');
check('provenance note disclaims official content',
  /not transcribed from any official stat block/i.test(DND_ACTOR_PRESET_PROVENANCE.sourceNote ?? ''));

// ── 2. every preset materializes into a VALID canonical sheet ───────────────
for (const id of DND_ACTOR_PRESET_IDS) {
  const sheet = materializeDndActorPreset(id, { displayName: 'Fixture', actorKind: 'npc' });
  const validation = validateDndLiteActorSheet(sheet);
  check(`${id} materializes a valid canonical sheet`, validation.valid);
  check(`${id} keeps the canonical schema version`, sheet.schemaVersion === 1);
  check(`${id} takes the caller's name and kind`, sheet.displayName === 'Fixture' && sheet.actorKind === 'npc');
  // T13/T14 must not sneak in through a preset.
  check(`${id} declares no conditions`, !(sheet as Record<string, unknown>).conditions);
  check(`${id} declares no resources or spell slots`,
    !(sheet as Record<string, unknown>).resources && !(sheet as Record<string, unknown>).spellSlots);
}

// ── 3. the T12 action contract ─────────────────────────────────────────────
for (const id of DND_ACTOR_PRESET_IDS) {
  const sheet = materializeDndActorPreset(id, { displayName: 'Fixture', actorKind: 'npc' });
  for (const action of sheet.actions) {
    check(`${id}:${action.id} uses a T12-resolvable kind`,
      action.kind === 'weapon_attack' || action.kind === 'spell_attack');
    check(`${id}:${action.id} carries an integer attack bonus in range`,
      typeof action.attackBonus === 'number' && Number.isSafeInteger(action.attackBonus)
      && action.attackBonus >= -100 && action.attackBonus <= 100);
    check(`${id}:${action.id} has a parseable damage formula`, (() => {
      if (!action.damageFormula) return true;
      parseDndDiceFormula(action.damageFormula);
      return true;
    })());
    // The projection's shortcut reader applies this pattern before a formula
    // ever reaches the resolver; a preset that failed it would be silently dropped.
    check(`${id}:${action.id} survives the projection formula filter`,
      !action.damageFormula || /^[0-9dD+\-\s]+$/.test(action.damageFormula));
    check(`${id}:${action.id} has a stable id and a name`,
      Boolean(action.id.trim()) && Boolean(action.name.trim()));
  }
}

// ── 4. attack bonus really is modifier + proficiency ────────────────────────
const martial = materializeDndActorPreset('martial', { displayName: 'Guardpost', actorKind: 'npc' });
check('martial has one attack', martial.actions.length === 1);
check('martial attack bonus is ability modifier plus proficiency',
  martial.actions[0].attackBonus === calculateDndAbilityModifier(martial.abilities.strength) + martial.proficiencyBonus);
check('martial damage adds the ability modifier', martial.actions[0].damageFormula === '1d8+2');
check('martial seeds current HP from max HP',
  martial.defenses.maxHp === 16 && martial.defenses.currentHp === 16);
check('martial derives proficient skills from the ability plus proficiency',
  martial.skills?.athletics === calculateDndAbilityModifier(martial.abilities.strength) + 2
  && martial.skills?.athletics === 4
  && martial.skills?.perception === calculateDndAbilityModifier(martial.abilities.wisdom) + 2);
check('martial leaves unlisted skills undefined', martial.skills?.arcana === undefined);

const commoner = materializeDndActorPreset('commoner', { displayName: 'Baker', actorKind: 'npc' });
check('an ordinary person still has something to do in combat', commoner.actions.length === 1);
check('a zero ability modifier is not appended to the damage formula',
  commoner.actions[0].damageFormula === '1d4');

const adept = materializeDndActorPreset('adept', { displayName: 'Hedge adept', actorKind: 'npc' });
check('spellcaster-like uses a spell attack', adept.actions[0].kind === 'spell_attack');
check('spellcaster-like grants no spell slots or resources',
  !(adept as Record<string, unknown>).spellSlots);

// ── 5. blank really is blank ───────────────────────────────────────────────
const blank = materializeDndActorPreset('blank', { displayName: 'Nobody', actorKind: 'npc' });
check('blank has no actions', blank.actions.length === 0);
check('blank has no authored defenses', Object.keys(blank.defenses).length === 0);
check('blank keeps default abilities', blank.abilities.strength === 10);
check('an unknown preset id falls back to blank, never throws',
  materializeDndActorPreset('not-a-preset', { displayName: 'X', actorKind: 'npc' }).actions.length === 0);

// ── 6. preset vs custom ────────────────────────────────────────────────────
const unchanged = compareDndActorPresetState({ presetId: 'martial', presetVersion: DND_ACTOR_PRESET_DEFINITION_VERSION, sheet: martial });
check('an untouched preset sheet reads as preset', unchanged.status === 'preset');
check('an untouched preset sheet lists no changed fields', unchanged.changedFields.length === 0);

const renamed = compareDndActorPresetState({ presetId: 'martial', sheet: { ...martial, displayName: 'Sergeant Vale' } });
check('renaming the actor does NOT make it custom', renamed.status === 'preset');

const noted = compareDndActorPresetState({ presetId: 'martial', sheet: { ...martial, notes: 'Guards the east gate.', tags: ['gate'] } });
check('notes and tags do NOT make it custom', noted.status === 'preset');

const tempHp = compareDndActorPresetState({ presetId: 'martial', sheet: { ...martial, defenses: { ...martial.defenses, temporaryHp: 5 } } });
check('temporary HP does NOT make it custom', tempHp.status === 'preset');

const rehp = compareDndActorPresetState({ presetId: 'martial', sheet: { ...martial, defenses: { ...martial.defenses, maxHp: 22 } } });
check('changing max HP makes it custom', rehp.status === 'custom');
check('the changed field is named', rehp.changedFields.includes('defenses.maxHp'));

const restat = compareDndActorPresetState({ presetId: 'martial', sheet: { ...martial, abilities: { ...martial.abilities, strength: 18 } } });
check('changing an ability makes it custom', restat.status === 'custom' && restat.changedFields.includes('abilities'));

const reweapon = compareDndActorPresetState({
  presetId: 'martial',
  sheet: { ...martial, actions: [{ ...martial.actions[0], name: 'Rusty axe' }] },
});
check('renaming an action makes it custom', reweapon.status === 'custom' && reweapon.changedFields.includes('actions'));

const dropped = compareDndActorPresetState({ presetId: 'martial', sheet: { ...martial, actions: [] } });
check('removing the action makes it custom', dropped.status === 'custom');

check('an actor with no preset is unknown, not custom',
  compareDndActorPresetState({ presetId: undefined, sheet: martial }).status === 'unknown');
check('an actor from an older definition is unknown, not custom', (() => {
  const stale = compareDndActorPresetState({ presetId: 'martial', presetVersion: DND_ACTOR_PRESET_DEFINITION_VERSION - 1, sheet: martial });
  return stale.status === 'unknown' && stale.definitionVersionMismatch === true;
})());

// Comparison must be order- and undefined-insensitive, not JSON-string equality.
const reordered = compareDndActorPresetState({
  presetId: 'martial',
  sheet: {
    ...martial,
    abilities: { charisma: martial.abilities.charisma, wisdom: martial.abilities.wisdom, intelligence: martial.abilities.intelligence, constitution: martial.abilities.constitution, dexterity: martial.abilities.dexterity, strength: martial.abilities.strength },
    skills: { perception: martial.skills!.perception, athletics: martial.skills!.athletics },
  },
});
check('key order does not make it custom', reordered.status === 'preset');

// ── 7. reset ───────────────────────────────────────────────────────────────
const customised = {
  ...martial,
  displayName: 'Sergeant Vale',
  notes: 'Guards the east gate.',
  tags: ['gate'],
  abilities: { ...martial.abilities, strength: 18 },
  defenses: { ...martial.defenses, maxHp: 22, currentHp: 9, temporaryHp: 5 },
  actions: [],
};
const reset = resetSheetToDndActorPreset({ presetId: 'martial', sheet: customised })!;
check('reset restores preset-controlled values', reset.abilities.strength === 14 && reset.defenses.maxHp === 16);
check('reset restores the preset action', reset.actions.length === 1 && reset.actions[0].id === 'melee-weapon');
check('reset keeps the actor name', reset.displayName === 'Sergeant Vale');
check('reset keeps notes and tags', reset.notes === 'Guards the east gate.' && reset.tags?.[0] === 'gate');
check('reset keeps temporary HP', reset.defenses.temporaryHp === 5);
check('reset produces a preset-clean sheet',
  compareDndActorPresetState({ presetId: 'martial', sheet: reset }).status === 'preset');
check('reset returns a NEW object, never mutating the input',
  reset !== customised && customised.abilities.strength === 18 && customised.defenses.maxHp === 22);
check('reset of an unknown preset is undefined, not a blank wipe',
  resetSheetToDndActorPreset({ presetId: 'nope', sheet: customised }) === undefined);

// ── 8. no live template inheritance ────────────────────────────────────────
const first = materializeDndActorPreset('brute', { displayName: 'Ogre A', actorKind: 'monster' });
first.abilities.strength = 30;
first.actions.push({ id: 'extra', name: 'Extra', kind: 'utility' });
const second = materializeDndActorPreset('brute', { displayName: 'Ogre B', actorKind: 'monster' });
check('materialized sheets do not share ability state', second.abilities.strength === 17);
check('materialized sheets do not share action arrays', second.actions.length === 1);
const definition = getDndActorPreset('brute')!;
check('the definition itself was not mutated', definition.values.abilities?.strength === 17);

// ── 9. provenance round-trip in the existing override bag ──────────────────
const hostEdited = { someOtherOverrideV1: { keep: true } } as Record<string, unknown>;
let payload = withDndLiteActorSheetOverride(hostEdited, martial);
payload = withDndActorPresetProvenance(payload, { presetId: 'martial', presetVersion: DND_ACTOR_PRESET_DEFINITION_VERSION, materializedAt: '2026-09-11T00:00:00.000Z' });
check('the sheet still reads back', readDndLiteActorSheetOverride(payload)?.displayName === 'Guardpost');
check('the preset marker reads back', readDndActorPresetProvenance(payload)?.presetId === 'martial');
check('unrelated override keys survive', (payload.someOtherOverrideV1 as { keep: boolean }).keep === true);
check('the marker is a sibling, not part of the sheet',
  (payload[DND_LITE_ACTOR_SHEET_OVERRIDE_KEY] as Record<string, unknown>).dndActorPresetV1 === undefined
  && payload[DND_ACTOR_PRESET_OVERRIDE_KEY] !== undefined);
const cleared = withoutDndLiteActorSheetOverride(payload);
check('clearing the sheet clears the marker with it',
  readDndLiteActorSheetOverride(cleared) === undefined && readDndActorPresetProvenance(cleared) === undefined);
check('clearing keeps unrelated override keys', (cleared.someOtherOverrideV1 as { keep: boolean }).keep === true);
check('a malformed marker is ignored rather than trusted',
  readDndActorPresetProvenance({ dndActorPresetV1: { presetId: 'martial' } }) === undefined);
check('an old actor gets no inferred provenance', readDndActorPresetProvenance({}) === undefined);

// ── 10. the picker lists what each entrance should offer ───────────────────
const npcPresets = listDndActorPresets('npc');
const monsterPresets = listDndActorPresets('monster');
check('npc presets include an ordinary person', npcPresets.some((preset) => preset.id === 'commoner'));
check('npc presets exclude monster-only archetypes', !npcPresets.some((preset) => preset.id === 'brute'));
check('monster presets include a brute', monsterPresets.some((preset) => preset.id === 'brute'));
check('monster presets exclude npc-only archetypes', !monsterPresets.some((preset) => preset.id === 'expert'));
check('both lists offer a blank start', npcPresets.some((p) => p.id === 'blank') && monsterPresets.some((p) => p.id === 'blank'));
check('blank is listed last', npcPresets[npcPresets.length - 1].id === 'blank');
check('a recommended preset is listed first', npcPresets[0].recommended === true);
check('every preset has bilingual copy', [...npcPresets, ...monsterPresets].every((preset) =>
  preset.nameCn && preset.nameEn && preset.blurbCn && preset.blurbEn));
check('blurbs stay short enough for a card',
  [...npcPresets, ...monsterPresets].every((preset) => preset.blurbEn.length <= 70 && preset.blurbCn.length <= 34));

// ── 11. temporary-character reuse carries only what the contract holds ─────
const quick = dndActorPresetQuickDraftValues('scout', 'en')!;
check('quick draft values carry HP and AC', quick.hpMax === 13 && quick.hpCurrent === 13 && quick.armorClass === 14);
check('quick draft values carry a summary', quick.summary === 'Scout / agile');
check('quick draft values carry nothing the admission contract cannot hold',
  Object.keys(quick).sort().join(',') === 'armorClass,hpCurrent,hpMax,summary');
check('blank supplies no quick draft values', dndActorPresetQuickDraftValues('blank') === undefined);

console.log(JSON.stringify({ status: 'passed', suite: 'dndActorPresets', assertions: cases.length }, null, 2));
