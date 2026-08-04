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

const mercy = findSubclass('武僧', '命流武者');
assert(mercy.unlockLevel === 3, 'Warrior of Mercy should unlock at level 3');
assert(mercy.features.some((feature) => feature.name === '命极之手' && feature.unlockLevel === 17), 'Warrior of Mercy should expose its level 17 feature');

const shadow = findSubclass('武僧', '暗影宗');
assert(shadow.features.some((feature) => feature.name === '暗影步' && feature.unlockLevel === 6), 'Shadow Monk should expose Shadow Step');

const sea = findSubclass('德鲁伊', '海洋结社');
assert(sea.unlockLevel === 3, 'Circle of the Sea should unlock at level 3');
assert(sea.features.some((feature) => feature.name === '大洋慨赠' && feature.unlockLevel === 14), 'Circle of the Sea should expose its level 14 feature');

const stars = findSubclass('德鲁伊', '星辰结社');
assert(stars.features.some((feature) => feature.name === '星耀形态' && feature.unlockLevel === 3), 'Circle of Stars should expose Starry Form');
assert(stars.features.some((feature) => feature.name === '灿若繁星' && feature.unlockLevel === 14), 'Circle of Stars should expose Full of Stars');

console.log('DND class subclass source batch 2 smoke passed.');
