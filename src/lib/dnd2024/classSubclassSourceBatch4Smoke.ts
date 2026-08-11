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

const arcaneTrickster = findSubclass('游荡者', '奥法诡术师');
assert(arcaneTrickster.unlockLevel === 3, 'Arcane Trickster compatibility entry should unlock at level 3');
assert(arcaneTrickster.features.some((feature) => feature.name === '法术窃贼' && feature.unlockLevel === 17), 'Arcane Trickster should expose Spell Thief');

const soulknife = findSubclass('游荡者', '魂刃');
assert(soulknife.features.some((feature) => feature.name === '灵能力量' && feature.unlockLevel === 3), 'Soulknife should expose Psionic Power');
assert(soulknife.features.some((feature) => feature.name === '撕裂心智' && feature.unlockLevel === 17), 'Soulknife should expose Rend Mind');

const draconic = findSubclass('术士', '龙族血脉');
assert(draconic.unlockLevel === 3, 'Draconic Sorcery compatibility entry should unlock at level 3');
assert(draconic.features.some((feature) => feature.name === '元素亲和' && feature.unlockLevel === 6), 'Draconic Sorcery should expose Elemental Affinity');
assert(draconic.features.some((feature) => feature.name === '龙族伙伴' && feature.unlockLevel === 18), 'Draconic Sorcery should expose Dragon Companion');

const aberrant = findSubclass('术士', '畸变术法');
assert(aberrant.features.some((feature) => feature.name === '灵能术法' && feature.unlockLevel === 6), 'Aberrant Sorcery should expose Psionic Sorcery');
assert(aberrant.features.some((feature) => feature.name === '扭曲内爆' && feature.unlockLevel === 18), 'Aberrant Sorcery should expose Warping Implosion');

const clockwork = findSubclass('术士', '时械术法');
assert(clockwork.features.some((feature) => feature.name === '归复平衡' && feature.unlockLevel === 3), 'Clockwork Sorcery should expose Restore Balance');
assert(clockwork.features.some((feature) => feature.name === '时械矩阵' && feature.unlockLevel === 18), 'Clockwork Sorcery should expose Clockwork Cavalcade');

console.log('DND class subclass source batch 4 smoke passed.');
