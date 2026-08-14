import type { ClassDef, HitDiceType, SubclassDef } from '../dnd-types';
import { getClassProgression, getLevelProgression } from './progression-utils';
import type { DndClassKey } from './progression-types';

export type DndClassAdvancementCoverage =
  | 'source-backed'
  | 'partial'
  | 'personal'
  | 'unavailable';

export type DndClassAdvancementFeature = {
  name: string;
  description?: string;
};

export type DndClassAdvancementSummary = {
  currentLevel: number;
  nextLevel: number;
  canLevelUp: boolean;
  averageHitPointIncrease: number;
  subclassOptions: SubclassDef[];
  features: DndClassAdvancementFeature[];
  resources: string[];
  actions: string[];
  passiveFeatures: string[];
  coverage: DndClassAdvancementCoverage;
  coverageNote?: string;
};

const CLASS_KEY_BY_NAME: Record<string, DndClassKey> = {
  野蛮人: 'barbarian',
  吟游诗人: 'bard',
  牧师: 'cleric',
  德鲁伊: 'druid',
  战士: 'fighter',
  武僧: 'monk',
  圣武士: 'paladin',
  游侠: 'ranger',
  游荡者: 'rogue',
  术士: 'sorcerer',
  邪术师: 'warlock',
  法师: 'wizard',
};

const AVERAGE_HIT_POINTS_BY_DIE: Record<HitDiceType, number> = {
  D4: 3,
  D6: 4,
  D8: 5,
  D10: 6,
  D12: 7,
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function resolveClassKey(classDef: ClassDef | undefined): DndClassKey | undefined {
  if (!classDef) return undefined;
  const canonicalId = classDef.id?.replace(/^class\./, '');
  if (canonicalId && Object.values(CLASS_KEY_BY_NAME).includes(canonicalId as DndClassKey)) {
    return canonicalId as DndClassKey;
  }
  return CLASS_KEY_BY_NAME[classDef.name];
}

/** Produces a display-only summary for the next allocated class level. */
export function getDndClassAdvancementSummary(input: {
  classDef?: ClassDef;
  currentLevel: number;
  hasSelectedSubclass: boolean;
}): DndClassAdvancementSummary {
  // A newly selected multiclass target starts at class level 0 and advances
  // to level 1. Keeping zero here prevents the preview from skipping the
  // target class's first-level features.
  const currentLevel = Math.max(0, Math.floor(input.currentLevel));
  const nextLevel = Math.min(20, currentLevel + 1);
  const canLevelUp = currentLevel < 20;
  const classDef = input.classDef;
  const classKey = resolveClassKey(classDef);
  const levelData = classKey ? getLevelProgression(classKey, nextLevel) : null;
  const progression = classKey ? getClassProgression(classKey) : null;

  const localFeatures = classDef?.features
    .filter((feature) => feature.unlockLevel === nextLevel)
    .map((feature) => ({ name: feature.name, description: feature.desc })) ?? [];
  const progressionFeatures = levelData?.features.map((name) => ({ name })) ?? [];
  const features = Array.from(
    new Map([...localFeatures, ...progressionFeatures].map((feature) => [feature.name, feature])).values(),
  );

  if (!classDef) {
    return {
      currentLevel,
      nextLevel,
      canLevelUp: false,
      averageHitPointIncrease: 5,
      subclassOptions: [],
      features: [],
      resources: [],
      actions: [],
      passiveFeatures: [],
      coverage: 'unavailable',
      coverageNote: '尚未找到当前职业的成长定义，不能安全执行升级。',
    };
  }

  const isPartial = Boolean(levelData?.notes?.includes('待后续补全'));
  const coverage: DndClassAdvancementCoverage = progression
    ? isPartial ? 'partial' : 'source-backed'
    : 'personal';
  const coverageNote = coverage === 'partial'
    ? '此职业的成长表仍在逐项校对；这里只显示当前已入库的资料。'
    : coverage === 'personal'
      ? '此个人职业保留作者声明；具体等级规则应在房间审核时确认。'
      : undefined;
  const progressionRequiresSubclass = Boolean(
    !input.hasSelectedSubclass && levelData?.features.some((feature) => feature.includes('子职')),
  );
  const subclassOptions = input.hasSelectedSubclass
    ? []
    : progressionRequiresSubclass
      // The owner-source progression table is authoritative for unlock level;
      // older ClassDef entries may still carry legacy unlock-level metadata.
      ? classDef.subclasses
      : classDef.subclasses.filter((subclass) => subclass.unlockLevel === nextLevel);

  return {
    currentLevel,
    nextLevel,
    canLevelUp,
    averageHitPointIncrease: AVERAGE_HIT_POINTS_BY_DIE[classDef.hitDice],
    subclassOptions,
    features,
    resources: unique(levelData?.resources.map((resource) => resource.sourceFeature) ?? []),
    actions: unique(levelData?.actions.map((action) => action.nameCn) ?? []),
    passiveFeatures: unique(levelData?.passiveFeatures.map((feature) => feature.nameCn) ?? []),
    coverage,
    coverageNote,
  };
}
