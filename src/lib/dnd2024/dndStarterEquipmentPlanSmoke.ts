import { strict as assert } from 'node:assert';
import { CLASS_DATA } from '../../data/classes.js';
import { buildStarterEquipmentPlan, type StarterEquipmentPlan } from './dndStarterEquipmentPlan.js';

function plan(className: string): StarterEquipmentPlan {
  const classDefinition = CLASS_DATA.find((candidate) => candidate.name === className);
  assert.ok(classDefinition, `missing class fixture: ${className}`);
  return buildStarterEquipmentPlan(classDefinition.startingEquipment);
}

function findOption(result: StarterEquipmentPlan, definitionId: string) {
  return result.choices.flatMap((group) => group.options)
    .find((option) => option.definitionId === definitionId);
}

function findFixed(result: StarterEquipmentPlan, definitionId: string) {
  return result.fixed.find((item) => item.definitionId === definitionId);
}

const barbarian = plan('野蛮人');
assert.equal(findOption(barbarian, 'weapon.handaxe')?.quantity, 2);
assert.equal(findFixed(barbarian, 'weapon.javelin')?.quantity, 4);

const fighter = plan('战士');
assert.equal(findOption(fighter, 'weapon.handaxe')?.quantity, 2);
assert.ok(fighter.choices.flatMap((group) => group.options)
  .some((option) => option.label === '轻弩与20支弩矢' && !option.definitionId));

const rogue = plan('游荡者');
assert.equal(findFixed(rogue, 'weapon.dagger')?.quantity, 2);
assert.ok(rogue.choices.flatMap((group) => group.options)
  .some((option) => option.label === '短弓及20支箭' && !option.definitionId));

const paladin = plan('圣武士');
assert.equal(findOption(paladin, 'weapon.javelin')?.quantity, 5);

const ranger = plan('游侠');
assert.equal(findOption(ranger, 'weapon.shortsword')?.quantity, 2);
assert.ok(ranger.fixed.some((item) => item.label === '长弓及20支箭' && !item.definitionId));

const warlock = plan('邪术师');
assert.equal(findFixed(warlock, 'weapon.handaxe')?.quantity, 2);

const monk = plan('武僧');
assert.equal(findFixed(monk, 'weapon.dart')?.quantity, 10);

const sorcerer = plan('术士');
assert.ok(sorcerer.fixed.some((item) => item.label === '刃' && item.quantity === 2 && !item.definitionId));

console.log(JSON.stringify({
  status: 'passed',
  checks: 12,
  verified: [
    'counted canonical choice identity and quantity',
    'counted canonical fixed-item identity and quantity',
    'compound weapon-plus-ammunition bundles remain unresolved',
    'unknown source text remains unresolved',
  ],
}));
