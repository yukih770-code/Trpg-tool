import {
  DndDiceFormulaError,
  dndAttackToRuntimeEvent,
  dndCheckToRuntimeEvent,
  dndDamageToRuntimeEvent,
  parseDndDiceFormula,
  rollDndAttack,
  rollDndCheck,
  rollDndDamage,
  rollDndDiceFormula,
} from './dndDiceRoller';

const cases: string[] = [];

function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

function sequence(values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? values[values.length - 1] ?? 0;
}

function rejects(name: string, action: () => unknown): void {
  try { action(); } catch (error) {
    check(name, error instanceof DndDiceFormulaError);
    return;
  }
  throw new Error(`failed: ${name}`);
}

const d20 = parseDndDiceFormula('d20');
check('parse d20', d20.diceGroups.length === 1 && d20.diceGroups[0]?.count === 1 && d20.diceGroups[0]?.sides === 20 && d20.modifier === 0);
const d20Plus = parseDndDiceFormula('1d20+5');
check('parse 1d20+5', d20Plus.diceGroups[0]?.sides === 20 && d20Plus.modifier === 5);
const damage = parseDndDiceFormula('2d6+3');
check('parse 2d6+3', damage.diceGroups[0]?.count === 2 && damage.diceGroups[0]?.sides === 6 && damage.modifier === 3);
check('support multiple dice groups', rollDndDiceFormula('1d4+1d6+2', sequence([0, 0])).total === 4);
rejects('reject invalid formula', () => parseDndDiceFormula('1d'));
rejects('reject unsafe expression', () => parseDndDiceFormula('1d20+process.exit()'));
rejects('reject too many dice', () => parseDndDiceFormula('101d6'));

const normal = rollDndCheck({ kind: 'ability', modifier: 3 }, sequence([0.4]));
check('normal d20 roll', normal.rawRolls.length === 1 && normal.keptRoll === 9 && normal.total === 12);
const advantage = rollDndCheck({ kind: 'skill', mode: 'advantage' }, sequence([0.1, 0.8]));
check('advantage keeps highest', advantage.rawRolls.join(',') === '3,17' && advantage.keptRoll === 17);
const disadvantage = rollDndCheck({ kind: 'save', mode: 'disadvantage' }, sequence([0.9, 0.2]));
check('disadvantage keeps lowest', disadvantage.rawRolls.join(',') === '19,5' && disadvantage.keptRoll === 5);
const dcSuccess = rollDndCheck({ kind: 'generic', modifier: 2, dc: 15 }, sequence([0.65]));
check('DC success', dcSuccess.total === 16 && dcSuccess.outcome === 'success');
const dcFailure = rollDndCheck({ kind: 'generic', modifier: 0, dc: 15 }, sequence([0.4]));
check('DC failure', dcFailure.total === 9 && dcFailure.outcome === 'failure');
check('natural 20 marker', rollDndCheck({ kind: 'ability' }, sequence([0.999])).isNatural20);
check('natural 1 marker', rollDndCheck({ kind: 'ability' }, sequence([0])).isNatural1);

const hit = rollDndAttack({ attackBonus: 4, targetAc: 15 }, sequence([0.55]));
check('attack hit vs AC', hit.total === 16 && hit.outcome === 'hit');
const miss = rollDndAttack({ attackBonus: 1, targetAc: 16 }, sequence([0.4]));
check('attack miss vs AC', miss.total === 10 && miss.outcome === 'miss');
const unknown = rollDndAttack({ attackBonus: 3 }, sequence([0.4]));
check('unknown hit if AC missing', unknown.outcome === 'unknown');
check('attack natural 20 critical', rollDndAttack({ targetAc: 30 }, sequence([0.999])).outcome === 'hit');
check('attack natural 1 miss', rollDndAttack({ targetAc: 1 }, sequence([0])).outcome === 'miss');

const standardDamage = rollDndDamage('1d8+3', { random: sequence([0.5]) });
check('damage roll', standardDamage.total === 8 && !standardDamage.isCritical);
const criticalDamage = rollDndDamage('1d8+3', { critical: true, random: sequence([0, 0.5]) });
check('critical damage doubles dice only', criticalDamage.dice[0]?.rolls.join(',') === '1,5' && criticalDamage.total === 9 && criticalDamage.modifier === 3);

const checkEvent = dndCheckToRuntimeEvent({ ...dcSuccess, actorName: 'Arwen' });
check('dnd.check_rolled payload', checkEvent.eventKind === 'dnd.check_rolled' && checkEvent.payload.total === 16 && typeof checkEvent.payload.summary === 'string');
const attackEvent = dndAttackToRuntimeEvent({ ...hit, attackerName: 'Arwen' });
check('dnd.attack_rolled payload', attackEvent.eventKind === 'dnd.attack_rolled' && attackEvent.payload.ac === 15 && typeof attackEvent.payload.summary === 'string');
const damageEvent = dndDamageToRuntimeEvent(criticalDamage, 'Longsword');
check('dnd.damage_rolled payload', damageEvent.eventKind === 'dnd.damage_rolled' && damageEvent.payload.critical === true && typeof damageEvent.payload.summary === 'string');

const databaseUrlKey = ['DATABASE', 'URL'].join('_');
const viteDatabaseUrlKey = ['VITE', 'DATABASE', 'URL'].join('_');
check('no database environment fields', !(databaseUrlKey in checkEvent.payload) && !(viteDatabaseUrlKey in checkEvent.payload));

console.log(JSON.stringify({ total: cases.length, passed: cases.length, failed: 0, cases }, null, 2));
