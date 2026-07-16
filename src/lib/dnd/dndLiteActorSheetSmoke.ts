import {
  calculateDndAbilityModifier,
  createDefaultDndLiteActorSheet,
  getDndActionRollInput,
  getDndLiteCheckInput,
  getDndLiteCombatantPrefill,
  getDndSaveModifier,
  getDndSkillModifier,
  summarizeDndLiteActorSheet,
  validateDndLiteActorSheet,
} from './dndLiteActorSheet';

const cases: string[] = [];
function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

const sheet = createDefaultDndLiteActorSheet({ displayName: 'Arwen', actorKind: 'pc' });
check('default actor sheet creation', sheet.schemaVersion === 1 && sheet.displayName === 'Arwen' && sheet.actions.length === 0);
check('ability modifier 10 to 0', calculateDndAbilityModifier(10) === 0);
check('ability modifier 8 to -1', calculateDndAbilityModifier(8) === -1);
check('ability modifier 16 to +3', calculateDndAbilityModifier(16) === 3);
check('validate valid sheet', validateDndLiteActorSheet(sheet).valid);
check('reject invalid ability score', !validateDndLiteActorSheet({ ...sheet, abilities: { ...sheet.abilities, strength: 31 } }).valid);
check('proficiency bonus validation', !validateDndLiteActorSheet({ ...sheet, proficiencyBonus: 11 }).valid);
check('AC HP speed validation', !validateDndLiteActorSheet({ ...sheet, defenses: { armorClass: -1, currentHp: 20, maxHp: 10, speedFt: -1 } }).valid);

const skilled = { ...sheet, abilities: { ...sheet.abilities, dexterity: 16 }, skills: { acrobatics: 7 }, savingThrows: { wisdom: 5 } };
check('skill modifier fallback', getDndSkillModifier(sheet, 'acrobatics') === 0);
check('skill modifier override', getDndSkillModifier(skilled, 'acrobatics') === 7);
check('save modifier fallback', getDndSaveModifier(sheet, 'wisdom') === 0);
check('save modifier override', getDndSaveModifier(skilled, 'wisdom') === 5);

const actionSheet = {
  ...skilled,
  defenses: { armorClass: 16, currentHp: 12, maxHp: 18, speedFt: 30 },
  actions: [{ id: 'longsword', name: 'Longsword', kind: 'weapon_attack' as const, attackBonus: 5, damageFormula: '1d8+3', damageType: 'slashing' }],
};
const action = actionSheet.actions[0];
check('action with attack bonus', getDndActionRollInput(action).attackBonus === 5);
check('action with damage formula', getDndActionRollInput(action).damageFormula === '1d8+3');
check('action sheet validates', validateDndLiteActorSheet(actionSheet).valid);

const summary = summarizeDndLiteActorSheet(actionSheet);
check('summarize actor', summary.displayName === 'Arwen' && summary.hpText === '12/18' && summary.actionCount === 1);
const prefill = getDndLiteCombatantPrefill(actionSheet, 'campaign-actor-1');
check('combatant prefill model', prefill.displayName === 'Arwen' && prefill.armorClass === 16 && prefill.hpCurrent === 12 && prefill.sourceActorInstanceId === 'campaign-actor-1');
const checkInput = getDndLiteCheckInput(actionSheet, { type: 'skill', skill: 'acrobatics' });
check('dice panel check input from actor', checkInput.modifier === 7 && checkInput.label === 'acrobatics');
check('dice panel attack input from action', getDndActionRollInput(action).attackBonus === 5 && getDndActionRollInput(action).damageFormula === '1d8+3');

const databaseUrlKey = ['DATABASE', 'URL'].join('_');
const viteDatabaseUrlKey = ['VITE', 'DATABASE', 'URL'].join('_');
check('no database environment fields', !(databaseUrlKey in sheet) && !(viteDatabaseUrlKey in sheet));

console.log(JSON.stringify({ total: cases.length, passed: cases.length, failed: 0, cases }, null, 2));
