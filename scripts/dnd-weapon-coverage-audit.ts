import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  DND_BASIC_WEAPONS,
  DND_EQUIPMENT_DATA_ACCURACY,
} from '../src/data/dnd2024/equipment.js';
import { getDndItemDefinition } from '../src/lib/dnd2024/dndItemRegistry.js';
import { getDndActionDefinition } from '../src/lib/dnd2024/gameplay/dndActionDefinitions.js';
import { getDndEffectDefinition } from '../src/lib/dnd2024/gameplay/dndEffectDefinitions.js';
import { resolveDndItemDefinition } from '../src/lib/dnd2024/dndItemRegistry.js';

type Classification =
  | 'SAFE_NOW'
  | 'MISSING_APPROVED_DATA'
  | 'ACTION_SCHEMA_LIMITATION'
  | 'CREATOR_IDENTITY_LIMITATION'
  | 'RULE_ENGINE_LIMITATION'
  | 'DEFERRED_COMPLEX_MODE';

const rows = DND_BASIC_WEAPONS.map((catalogWeapon) => {
  const definition = getDndItemDefinition(catalogWeapon.id);
  const actions = (definition?.actionRefs ?? [])
    .map((actionId) => getDndActionDefinition(actionId))
    .filter((action) => action !== undefined);
  const effects = actions.flatMap((action) => action.effectRefs)
    .map((effectId) => getDndEffectDefinition(effectId))
    .filter((effect) => effect !== undefined && effect.type === 'damage');
  const executableModes = [...new Set(actions.flatMap((action) => action.tags ?? [])
    .filter((tag) => tag === 'melee' || tag === 'ranged' || tag === 'thrown'))].sort();
  const hasCanonicalAction = actions.length > 0;
  const hasCanonicalDamageEffect = effects.length > 0;
  const hasApprovedAbilityRule = (definition?.weaponProfile?.abilityOptions?.length ?? 0) > 0;
  const hasProficiencyMapping = definition?.weapon?.weaponCategory === 'simple'
    || definition?.weapon?.weaponCategory === 'martial';
  const hasT12CompatibleMode = executableModes.includes('melee');
  const safeNow = definition?.sourceStatus === 'sourced'
    && definition.weaponProfile?.sourceStatus === 'sourced'
    && hasCanonicalAction
    && hasCanonicalDamageEffect
    && hasApprovedAbilityRule
    && hasProficiencyMapping
    && hasT12CompatibleMode;
  const classification: Classification = safeNow ? 'SAFE_NOW' : 'MISSING_APPROVED_DATA';
  const blockingReasons = safeNow ? [] : [
    ...(DND_EQUIPMENT_DATA_ACCURACY.usagePolicy === 'display-only'
      ? ['catalog damage/property row is explicitly display-only'] : []),
    ...(!definition?.weaponProfile ? ['no source-backed executable weaponProfile'] : []),
    ...(!hasCanonicalAction ? ['no canonical gameplay Action definition'] : []),
    ...(!hasCanonicalDamageEffect ? ['no canonical gameplay damage Effect'] : []),
    ...(!hasApprovedAbilityRule ? ['no approved governing-ability rule'] : []),
    ...(executableModes.length === 0 ? ['no executable melee/ranged mode definition'] : []),
  ];

  return {
    canonicalDefinitionId: catalogWeapon.id,
    displayLabel: catalogWeapon.nameCn,
    englishLabel: catalogWeapon.name,
    catalogWeaponCategory: catalogWeapon.weaponCategory,
    canonicalActionDefinitionExists: hasCanonicalAction,
    canonicalDamageEffectExists: hasCanonicalDamageEffect,
    damageDiceAvailable: typeof catalogWeapon.damageDice === 'string' && catalogWeapon.damageDice.length > 0,
    damageDiceAuthority: safeNow ? 'EXECUTABLE_APPROVED' : 'DISPLAY_ONLY',
    damageTypeAvailable: typeof catalogWeapon.damageType === 'string' && catalogWeapon.damageType.length > 0,
    damageTypeAuthority: safeNow ? 'EXECUTABLE_APPROVED' : 'DISPLAY_ONLY',
    governingAbilityRuleRepresented: hasApprovedAbilityRule,
    proficiencyMappingRepresented: hasProficiencyMapping,
    executableAttackModesRepresented: executableModes,
    specialModeOrPropertyRequired: catalogWeapon.properties,
    characterCreatorCanPreserveCanonicalId:
      resolveDndItemDefinition(catalogWeapon.id)?.id === catalogWeapon.id
      && resolveDndItemDefinition(catalogWeapon.nameCn)?.id === catalogWeapon.id,
    dndEquipmentSnapshotV1CanPreserveCanonicalId: Boolean(definition),
    currentActionSchemaCanExpressCorrectly: hasT12CompatibleMode,
    t12CanResolveWithoutNewRuleLogic: Boolean(safeNow),
    finalClassification: classification,
    blockingReasons,
    supportedModes: safeNow ? ['melee'] : [],
    deferredModes: safeNow && executableModes.includes('thrown') ? ['thrown'] : [],
  };
});

const classificationCounts = rows.reduce<Record<Classification, number>>((counts, row) => {
  counts[row.finalClassification] += 1;
  return counts;
}, {
  SAFE_NOW: 0,
  MISSING_APPROVED_DATA: 0,
  ACTION_SCHEMA_LIMITATION: 0,
  CREATOR_IDENTITY_LIMITATION: 0,
  RULE_ENGINE_LIMITATION: 0,
  DEFERRED_COMPLEX_MODE: 0,
});

const report = {
  schemaVersion: 1,
  auditScope: 'D&D canonical weapon definitions present in approved local repository data',
  catalogAuthority: {
    source: DND_EQUIPMENT_DATA_ACCURACY.source,
    trustLevel: DND_EQUIPMENT_DATA_ACCURACY.trustLevel,
    usagePolicy: DND_EQUIPMENT_DATA_ACCURACY.usagePolicy,
    sourceRef: DND_EQUIPMENT_DATA_ACCURACY.sourceRef,
  },
  classificationRule:
    'The first blocking gate controls classification. A display-only catalog row without a sourced weapon profile, canonical Action/Effect, and governing-ability contract is MISSING_APPROVED_DATA even when its label contains numeric text.',
  canonicalWeaponCount: rows.length,
  safeNowCount: rows.filter((row) => row.finalClassification === 'SAFE_NOW').length,
  classificationCounts,
  rows,
};

const invalidSafeRows = rows.filter((row) => row.finalClassification === 'SAFE_NOW' && (
  !row.canonicalActionDefinitionExists
  || !row.canonicalDamageEffectExists
  || !row.governingAbilityRuleRepresented
  || !row.proficiencyMappingRepresented
  || !row.currentActionSchemaCanExpressCorrectly
  || !row.t12CanResolveWithoutNewRuleLogic
  || row.supportedModes.length === 0
));
if (rows.length !== 38
  || classificationCounts.SAFE_NOW !== report.safeNowCount
  || invalidSafeRows.length > 0) {
  throw new Error('Weapon coverage audit invariant failed: catalog count or derived SAFE_NOW classification is inconsistent.');
}

const output = `${JSON.stringify(report, null, 2)}\n`;
const outputFlag = process.argv.indexOf('--write');
if (outputFlag >= 0) {
  const requestedPath = process.argv[outputFlag + 1];
  if (!requestedPath) throw new Error('--write requires an output path');
  const outputPath = resolve(process.cwd(), requestedPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output, 'utf8');
  console.log(JSON.stringify({ status: 'passed', outputPath, weapons: rows.length, safeNow: report.safeNowCount }));
} else {
  process.stdout.write(output);
}
