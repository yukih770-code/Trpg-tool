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

const champion = findSubclass('战士', '冠军武士');
assert(champion.unlockLevel === 3, 'Champion compatibility entry should unlock at level 3');
assert(champion.features.some((feature) => feature.name === '百折不挠' && feature.unlockLevel === 18), 'Champion should expose source-matched high-level feature names');

const psiWarrior = findSubclass('战士', '灵能武士');
assert(psiWarrior.features.some((feature) => feature.name === '灵能力量' && feature.unlockLevel === 3), 'Psi Warrior should expose its level 3 feature');
assert(psiWarrior.features.some((feature) => feature.name === '念力宗师' && feature.unlockLevel === 18), 'Psi Warrior should expose its level 18 feature');

const light = findSubclass('牧师', '光明领域');
assert(light.unlockLevel === 3, 'Cleric domains should use the source level 3 unlock');
assert(light.features.some((feature) => feature.name === '光冕' && feature.unlockLevel === 17), 'Light domain should expose its level 17 feature');

const war = findSubclass('牧师', '战争领域');
assert(war.features.some((feature) => feature.name === '战争祭司' && feature.unlockLevel === 3), 'War domain should expose War Priest at level 3');
assert(war.features.some((feature) => feature.name === '战争化身' && feature.unlockLevel === 17), 'War domain should expose Avatar of Battle at level 17');

console.log('DND class subclass source batch 1 smoke passed.');
