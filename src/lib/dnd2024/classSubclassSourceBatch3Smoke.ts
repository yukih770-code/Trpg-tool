import { CLASS_DATA } from '../../data/classes';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function findSubclass(className: string, subclassName: string) {
  const classDef = CLASS_DATA.find((item) => item.name === className);
  const subclass = classDef?.subclasses.find((item) => item.name === subclassName);
  assert(subclass, `${className} should include ${subclassName}`);
  return subclass;
}

const glory = findSubclass('圣武士', '荣耀之誓');
assert(glory.unlockLevel === 3, 'Oath of Glory should unlock at level 3');
assert(glory.features.some((feature) => feature.name === '现世传说' && feature.unlockLevel === 20), 'Oath of Glory should expose its level 20 feature');

const vengeance = findSubclass('圣武士', '复仇之誓');
assert(vengeance.features.some((feature) => feature.name === '仇敌誓言' && feature.unlockLevel === 3), 'Oath of Vengeance should expose Vow of Enmity');

const fey = findSubclass('游侠', '妖精漫游者');
assert(fey.features.some((feature) => feature.name === '妖冶娴都' && feature.unlockLevel === 3), 'Fey Wanderer should expose Otherworldly Glamour');
assert(fey.features.some((feature) => feature.name === '雾行漫游' && feature.unlockLevel === 15), 'Fey Wanderer should expose Misty Wanderer');

const gloom = findSubclass('游侠', '幽域追踪者');
assert(gloom.features.some((feature) => feature.name === '恐惧伏击' && feature.unlockLevel === 3), 'Gloom Stalker compatibility entry should expose Dread Ambusher');
assert(gloom.features.some((feature) => feature.name === '如影随行' && feature.unlockLevel === 15), 'Gloom Stalker compatibility entry should expose Shadowy Dodge');

console.log('DND class subclass source batch 3 smoke passed.');
