import {
  buildCharacterClearanceDetails,
  clearanceDetailsFromRoomActorRef,
  normalizeCharacterClearanceDetails,
} from './characterClearanceDetails';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const dndSnapshot = {
  id: 'actor-dnd', name: 'Ariadne', race: 'High Elf', jobClass: 'Ranger', subclass: 'Hunter', level: 4,
  background: 'Scout', description: 'Quiet pathfinder', hpCurrent: 22, hpMax: 30, tempHp: 3, acMod: 15, speed: '30',
  attrs: { Str: { base: 10 }, Dex: { base: 16 }, Con: { base: 14 } },
  skillProficiencies: ['Stealth', 'Perception'], savingThrowProficiencies: ['Dex', 'Wis'],
  inventory: ['Longbow', 'Rope'], feats: ['Alert'], activeMods: ['Longstrider'], weaponProficiencies: ['Martial weapons'],
};

const dndLiteSnapshot = {
  displayName: 'Lio', actorKind: 'pc', abilities: { strength: 10, dexterity: 16 }, proficiencyBonus: 2,
  defenses: { armorClass: 14, currentHp: 9, maxHp: 12, speedFt: 30 }, tags: ['Scout'], notes: 'Quick and careful', actions: [],
};

const cases: Array<{ name: string; run: () => void }> = [
  {
    name: 'DND snapshot keeps compact combat, identity, equipment, traits, and effects labels',
    run: () => {
      const details = buildCharacterClearanceDetails({ name: 'Ariadne', sourceType: 'localActorVault', systemId: 'dnd5e-2024', snapshot: dndSnapshot });
      expect(details.identity.speciesOrRace === 'High Elf' && details.identity.classSummary === 'Ranger' && details.identity.level === 4, 'DND identity missing');
      expect(details.combat.hpMax === 30 && details.combat.ac === 15, 'DND combat missing');
      expect(details.equipment.notableItems?.includes('Longbow'), 'equipment missing');
      expect(details.traits.feats?.includes('Alert'), 'feat missing');
      expect(details.effects.permanentBuffs?.includes('Longstrider'), 'buff missing');
    },
  },
  {
    name: 'DND Lite actor details include HP and AC without requiring DND-only fields',
    run: () => {
      const details = buildCharacterClearanceDetails({ name: 'Lio', sourceType: 'localActorVault', systemId: 'dnd5e-2024', snapshot: dndLiteSnapshot });
      expect(details.combat.hpCurrent === 9 && details.combat.hpMax === 12 && details.combat.ac === 14, 'DND Lite defenses missing');
    },
  },
  {
    name: 'quick draft details retain summary and shallow HP AC',
    run: () => {
      const details = buildCharacterClearanceDetails({ name: 'Draft', sourceType: 'quickDraft', summary: 'A simple local draft', hpCurrent: 5, hpMax: 8, armorClass: 12 });
      expect(details.review.summary === 'A simple local draft' && details.combat.hpMax === 8 && details.combat.ac === 12, 'quick draft details missing');
      expect(details.review.missingFields?.includes('装备'), 'quick draft should mention absent equipment');
    },
  },
  {
    name: 'missing optional sections are safe and do not invent details',
    run: () => {
      const details = buildCharacterClearanceDetails({ name: 'Minimal', sourceType: 'manualScaffold' });
      expect(!details.equipment.notableItems && !details.traits.feats, 'missing data was invented');
    },
  },
  {
    name: 'normalizer caps and rejects malformed payloads safely',
    run: () => {
      const normalized = normalizeCharacterClearanceDetails({ identity: { name: 'Safe', sourceType: 'imported' }, combat: { skills: ['A'.repeat(400)] }, equipment: {}, traits: {}, effects: {}, review: {} });
      expect(normalized?.combat.skills?.[0]?.length === 180, 'normalizer did not cap text');
      expect(normalizeCharacterClearanceDetails({ identity: { name: '' } }) === undefined, 'malformed details were accepted');
    },
  },
  {
    name: 'old shallow room actor summary receives a compatible fallback',
    run: () => {
      const details = clearanceDetailsFromRoomActorRef({ systemId: 'dnd5e-2024', displayName: 'Legacy', source: 'quickDraft', summary: 'Old binding', hpCurrent: 4, hpMax: 7, armorClass: 11 });
      expect(details.identity.name === 'Legacy' && details.combat.hpMax === 7 && details.combat.ac === 11, 'legacy fallback broke');
    },
  },
];

const results = cases.map((test) => {
  try { test.run(); return { name: test.name, passed: true }; }
  catch (error) { return { name: test.name, passed: false, error: error instanceof Error ? error.message : String(error) }; }
});
const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, cases: results }, null, 2));
if (failed.length) process.exitCode = 1;
