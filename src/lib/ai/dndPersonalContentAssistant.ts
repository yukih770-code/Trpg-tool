import {
  parseDndPersonalActionLines,
  parseDndPersonalChoiceLines,
  parseDndPersonalFeatureLines,
  parseDndPersonalNamedRuleLines,
  parseDndPersonalResourceLines,
  type DndPersonalEditorEntryKind,
} from '../dnd/dndPersonalContentDefinitions';
import {
  DND_PERSONAL_CONTENT_ASSISTANT_FIELDS_BY_KIND,
  type DndPersonalContentAssistantFieldKey,
  type DndPersonalContentAssistantFieldValues,
  type DndPersonalContentAssistantGatewayResult,
  type DndPersonalContentAssistantRequest,
} from './dndPersonalContentAssistantTypes';

export type DndPersonalContentAuthoringSnapshot = {
  entryKind: DndPersonalEditorEntryKind;
  values: DndPersonalContentAssistantFieldValues;
};

export type DndPersonalContentAssistantIssue = {
  code: string;
  severity: 'warning' | 'blocker';
  message: string;
};

export type DndPersonalContentAssistantPlan = {
  suggestionId: string;
  model: string;
  entryKind: DndPersonalEditorEntryKind;
  proposalSummary: string;
  baseFingerprint: string;
  patch: DndPersonalContentAssistantFieldValues;
  nextValues: DndPersonalContentAssistantFieldValues;
  changedFields: DndPersonalContentAssistantFieldKey[];
  rationale: string[];
  modelWarnings: string[];
  issues: DndPersonalContentAssistantIssue[];
  ready: boolean;
};

export const DND_PERSONAL_CONTENT_ASSISTANT_FIELD_LABELS: Record<DndPersonalContentAssistantFieldKey, { zh: string; en: string }> = {
  entryName: { zh: '条目名称', en: 'Entry name' }, summary: { zh: '内容摘要', en: 'Summary' },
  ruleResources: { zh: '资源', en: 'Resources' }, ruleActions: { zh: '动作与能力', en: 'Actions and abilities' }, ruleChoices: { zh: '选择组', en: 'Choice groups' }, ruleTriggers: { zh: '触发与限制', en: 'Triggers and limits' },
  size: { zh: '体型', en: 'Size' }, speed: { zh: '基础速度', en: 'Base speed' }, traits: { zh: '种族特性', en: 'Species traits' }, heritageOptions: { zh: '血统选项', en: 'Heritage options' }, speciesLanguages: { zh: '种族语言', en: 'Species languages' }, speciesSenses: { zh: '特殊感官', en: 'Special senses' }, speciesAbilityOptions: { zh: '属性说明', en: 'Ability note' },
  backgroundSkills: { zh: '背景技能', en: 'Background skills' }, backgroundTools: { zh: '工具熟练', en: 'Tool proficiencies' }, backgroundEquipment: { zh: '背景装备', en: 'Background equipment' }, backgroundLanguages: { zh: '背景语言', en: 'Background languages' }, featureName: { zh: '背景特性名称', en: 'Feature name' }, featureDescription: { zh: '背景特性说明', en: 'Feature description' },
  classPrimaryAbility: { zh: '主属性', en: 'Primary ability' }, classHitDice: { zh: '生命骰', en: 'Hit die' }, classSavingThrows: { zh: '豁免熟练', en: 'Saving throws' }, classWeaponProficiencies: { zh: '武器熟练', en: 'Weapon proficiencies' }, classArmorProficiencies: { zh: '护甲训练', en: 'Armor training' }, classStartingEquipment: { zh: '起始装备说明', en: 'Starting equipment note' }, classFeatureLines: { zh: '职业特性', en: 'Class features' }, classSkillChoices: { zh: '技能选项', en: 'Skill choices' }, classSkillChoiceCount: { zh: '技能选择数量', en: 'Skill choice count' }, classToolChoices: { zh: '工具选项', en: 'Tool choices' }, classSpellcastingProgression: { zh: '施法成长说明', en: 'Spellcasting progression note' }, classMulticlassNote: { zh: '多职业说明', en: 'Multiclass note' },
  subclassParentClass: { zh: '所属职业', en: 'Parent class' }, subclassUnlockLevel: { zh: '解锁等级', en: 'Unlock level' }, subclassFeatureLines: { zh: '子职业特性', en: 'Subclass features' },
  featCategory: { zh: '专长分类', en: 'Feat category' }, prerequisite: { zh: '前置条件', en: 'Prerequisite' },
  spellLevel: { zh: '法术环阶', en: 'Spell level' }, spellSchool: { zh: '学派或类型', en: 'School or type' }, spellCastTime: { zh: '施法时间', en: 'Casting time' }, spellRange: { zh: '施法距离', en: 'Range' }, spellDuration: { zh: '持续时间', en: 'Duration' }, spellComponents: { zh: '施法成分', en: 'Components' }, spellTarget: { zh: '目标', en: 'Target' }, spellSave: { zh: '豁免或攻击检定', en: 'Save or attack' }, spellArea: { zh: '区域与模板', en: 'Area and template' }, spellEffect: { zh: '效果说明', en: 'Effect note' }, spellScaling: { zh: '成长说明', en: 'Scaling note' },
  itemCategory: { zh: '物品分类', en: 'Item category' }, itemRarity: { zh: '稀有度', en: 'Rarity' }, itemWeight: { zh: '重量', en: 'Weight' }, itemCost: { zh: '价值', en: 'Cost' }, itemDamage: { zh: '伤害骰', en: 'Damage dice' }, itemDamageType: { zh: '伤害类型', en: 'Damage type' }, itemProperties: { zh: '武器属性', en: 'Weapon properties' }, itemArmorClass: { zh: '基础 AC', en: 'Base AC' }, itemUsage: { zh: '使用说明', en: 'Usage note' }, itemAttunement: { zh: '协调要求', en: 'Attunement' }, itemCharges: { zh: '充能与恢复', en: 'Charges and recovery' }, itemRequirements: { zh: '使用限制', en: 'Requirements and limits' }, itemEffects: { zh: '效果列表', en: 'Effect list' },
  monsterSize: { zh: '怪物体型', en: 'Monster size' }, monsterType: { zh: '生物类型', en: 'Creature type' }, monsterAlignment: { zh: '阵营', en: 'Alignment' }, monsterArmorClass: { zh: '护甲等级', en: 'Armor class' }, monsterHp: { zh: '生命值', en: 'Hit points' }, monsterSpeed: { zh: '速度', en: 'Speed' }, monsterChallenge: { zh: '挑战等级', en: 'Challenge rating' }, monsterTraits: { zh: '怪物特性', en: 'Monster traits' }, monsterActions: { zh: '怪物动作', en: 'Monster actions' }, monsterReactions: { zh: '怪物反应', en: 'Monster reactions' }, monsterLegendaryActions: { zh: '传奇动作', en: 'Legendary actions' }, monsterAbilityScores: { zh: '六项属性', en: 'Ability scores' }, monsterSavingThrows: { zh: '怪物豁免', en: 'Monster saving throws' }, monsterSkills: { zh: '怪物技能', en: 'Monster skills' }, monsterDamageVulnerabilities: { zh: '伤害易伤', en: 'Damage vulnerabilities' }, monsterDamageResistances: { zh: '伤害抗性', en: 'Damage resistances' }, monsterDamageImmunities: { zh: '伤害免疫', en: 'Damage immunities' }, monsterConditionImmunities: { zh: '状态免疫', en: 'Condition immunities' }, monsterSenses: { zh: '怪物感官', en: 'Monster senses' }, monsterLanguages: { zh: '怪物语言', en: 'Monster languages' }, monsterProficiencyBonus: { zh: '熟练加值', en: 'Proficiency bonus' },
};

export function dndPersonalContentAuthoringFingerprint(snapshot: DndPersonalContentAuthoringSnapshot): string {
  const orderedValues = Object.fromEntries(DND_PERSONAL_CONTENT_ASSISTANT_FIELDS_BY_KIND[snapshot.entryKind].map((field) => [field, snapshot.values[field] ?? '']));
  return JSON.stringify({ entryKind: snapshot.entryKind, values: orderedValues });
}

export function buildDndPersonalContentAssistantRequest(input: {
  intent: string;
  locale: 'zh-CN' | 'en';
  snapshot: DndPersonalContentAuthoringSnapshot;
}): DndPersonalContentAssistantRequest {
  let remaining = 32_000;
  const values: DndPersonalContentAssistantFieldValues = {};
  for (const field of DND_PERSONAL_CONTENT_ASSISTANT_FIELDS_BY_KIND[input.snapshot.entryKind]) {
    const raw = input.snapshot.values[field];
    if (typeof raw !== 'string' || !raw.trim() || remaining <= 0) continue;
    const bounded = raw.slice(0, Math.min(4_000, remaining));
    values[field] = bounded;
    remaining -= bounded.length;
  }
  return { intent: input.intent.trim().slice(0, 1_000), locale: input.locale, draft: { entryKind: input.snapshot.entryKind, values } };
}

function nonEmptyLines(value: string): string[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

function validateParsedLines(
  value: string,
  parser: (source: string) => unknown[],
  limit: number,
  field: DndPersonalContentAssistantFieldKey,
  label: string,
  issues: DndPersonalContentAssistantIssue[],
): void {
  const lines = nonEmptyLines(value);
  if (lines.length > limit || parser(value).length !== lines.length) {
    issues.push({ code: `invalid-${field}`, severity: 'blocker', message: `${label}的逐行格式无效或超过 ${limit} 行，请按编辑器提示调整。` });
  }
}

function validateInteger(value: string | undefined, min: number, max: number, field: string, label: string, issues: DndPersonalContentAssistantIssue[]): void {
  if (!value) return;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    issues.push({ code: `invalid-${field}`, severity: 'blocker', message: `${label}必须是 ${min} 至 ${max} 的整数。` });
  }
}

function validateValues(kind: DndPersonalEditorEntryKind, values: DndPersonalContentAssistantFieldValues): DndPersonalContentAssistantIssue[] {
  const issues: DndPersonalContentAssistantIssue[] = [];
  const name = values.entryName?.trim() ?? '';
  if (!name) issues.push({ code: 'missing-entry-name', severity: 'blocker', message: '建议必须提供条目名称。' });
  if (name.length > 120) issues.push({ code: 'entry-name-too-long', severity: 'blocker', message: '条目名称不能超过 120 个字符。' });
  if ((values.summary?.length ?? 0) > 2_000) issues.push({ code: 'summary-too-long', severity: 'blocker', message: '内容摘要不能超过 2000 个字符。' });
  if (kind === 'subclass' && !values.subclassParentClass?.trim()) issues.push({ code: 'missing-parent-class', severity: 'blocker', message: '子职业必须填写所属职业的准确名称。' });

  if (values.classPrimaryAbility && !['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'].includes(values.classPrimaryAbility)) issues.push({ code: 'invalid-primary-ability', severity: 'blocker', message: '职业主属性必须使用 Str、Dex、Con、Int、Wis 或 Cha。' });
  if (values.classHitDice && !['D4', 'D6', 'D8', 'D10', 'D12'].includes(values.classHitDice)) issues.push({ code: 'invalid-hit-die', severity: 'blocker', message: '职业生命骰必须是 D4、D6、D8、D10 或 D12。' });
  if (values.featCategory && !['Origin', 'General'].includes(values.featCategory)) issues.push({ code: 'invalid-feat-category', severity: 'blocker', message: '专长分类必须是 Origin 或 General。' });
  if (values.itemCategory && !['weapon', 'armor', 'gear', 'consumable', 'magicItem'].includes(values.itemCategory)) issues.push({ code: 'invalid-item-category', severity: 'blocker', message: '物品分类不在当前编辑器允许范围内。' });

  validateInteger(values.speed, 1, 999, 'speed', '基础速度', issues);
  validateInteger(values.classSkillChoiceCount, 0, 6, 'class-skill-count', '技能选择数量', issues);
  validateInteger(values.subclassUnlockLevel, 1, 20, 'subclass-level', '子职业解锁等级', issues);
  validateInteger(values.spellLevel, 0, 9, 'spell-level', '法术环阶', issues);
  validateInteger(values.itemArmorClass, 1, 99, 'item-ac', '物品基础 AC', issues);
  validateInteger(values.monsterArmorClass, 1, 99, 'monster-ac', '怪物护甲等级', issues);
  validateInteger(values.monsterHp, 1, 999_999, 'monster-hp', '怪物生命值', issues);
  if (values.itemWeight && (!Number.isFinite(Number(values.itemWeight)) || Number(values.itemWeight) < 0)) issues.push({ code: 'invalid-item-weight', severity: 'blocker', message: '物品重量必须是非负数字。' });

  const listFields: DndPersonalContentAssistantFieldKey[] = ['traits', 'heritageOptions', 'speciesLanguages', 'backgroundSkills', 'backgroundTools', 'backgroundLanguages', 'classSavingThrows', 'classWeaponProficiencies', 'classArmorProficiencies', 'classSkillChoices', 'classToolChoices', 'itemProperties', 'monsterDamageVulnerabilities', 'monsterDamageResistances', 'monsterDamageImmunities', 'monsterConditionImmunities'];
  for (const field of listFields) {
    if (values[field] && nonEmptyLines(values[field]!).length > 12) issues.push({ code: `too-many-${field}`, severity: 'blocker', message: `${DND_PERSONAL_CONTENT_ASSISTANT_FIELD_LABELS[field].zh}不能超过 12 行，以免保存时静默截断。` });
  }

  if (values.classFeatureLines) validateParsedLines(values.classFeatureLines, (value) => parseDndPersonalFeatureLines(value), 40, 'classFeatureLines', '职业特性', issues);
  if (values.subclassFeatureLines) validateParsedLines(values.subclassFeatureLines, (value) => parseDndPersonalFeatureLines(value, Number(values.subclassUnlockLevel) || 1), 40, 'subclassFeatureLines', '子职业特性', issues);
  if (values.ruleResources) validateParsedLines(values.ruleResources, parseDndPersonalResourceLines, 20, 'ruleResources', '资源', issues);
  if (values.ruleActions) validateParsedLines(values.ruleActions, parseDndPersonalActionLines, 40, 'ruleActions', '动作与能力', issues);
  if (values.ruleChoices) validateParsedLines(values.ruleChoices, parseDndPersonalChoiceLines, 20, 'ruleChoices', '选择组', issues);
  for (const field of ['ruleTriggers', 'itemEffects', 'monsterTraits', 'monsterActions', 'monsterReactions', 'monsterLegendaryActions'] as const) {
    if (values[field]) validateParsedLines(values[field]!, parseDndPersonalNamedRuleLines, 40, field, DND_PERSONAL_CONTENT_ASSISTANT_FIELD_LABELS[field].zh, issues);
  }
  return issues;
}

export function buildDndPersonalContentAssistantPlan(input: {
  snapshot: DndPersonalContentAuthoringSnapshot;
  result: DndPersonalContentAssistantGatewayResult;
}): DndPersonalContentAssistantPlan {
  const { snapshot, result } = input;
  const issues: DndPersonalContentAssistantIssue[] = [];
  const allowed = new Set(DND_PERSONAL_CONTENT_ASSISTANT_FIELDS_BY_KIND[snapshot.entryKind]);
  if (result.suggestion.entryKind !== snapshot.entryKind) {
    issues.push({ code: 'entry-kind-mismatch', severity: 'blocker', message: '模型返回的资料类型与当前编辑器不一致。' });
  }

  const patch: DndPersonalContentAssistantFieldValues = {};
  for (const item of result.suggestion.fieldValues) {
    if (!allowed.has(item.field)) {
      issues.push({ code: `unsupported-${item.field}`, severity: 'blocker', message: `模型尝试修改当前资料类型不支持的字段：${item.field}。` });
      continue;
    }
    patch[item.field] = item.value.trim();
  }
  const nextValues = { ...snapshot.values, ...patch };
  const changedFields = Object.keys(patch).filter((field) => patch[field as DndPersonalContentAssistantFieldKey] !== snapshot.values[field as DndPersonalContentAssistantFieldKey]) as DndPersonalContentAssistantFieldKey[];
  if (changedFields.length === 0) issues.push({ code: 'no-change', severity: 'blocker', message: '建议没有产生可应用的字段变化。' });
  issues.push(...validateValues(snapshot.entryKind, nextValues));

  return {
    suggestionId: result.suggestionId,
    model: result.model,
    entryKind: snapshot.entryKind,
    proposalSummary: result.suggestion.proposalSummary,
    baseFingerprint: dndPersonalContentAuthoringFingerprint(snapshot),
    patch,
    nextValues,
    changedFields,
    rationale: result.suggestion.rationale,
    modelWarnings: result.suggestion.warnings,
    issues,
    ready: !issues.some((issue) => issue.severity === 'blocker'),
  };
}

export function applyDndPersonalContentAssistantPlan(
  snapshot: DndPersonalContentAuthoringSnapshot,
  plan: DndPersonalContentAssistantPlan,
): DndPersonalContentAssistantFieldValues | null {
  if (!plan.ready || plan.entryKind !== snapshot.entryKind || plan.baseFingerprint !== dndPersonalContentAuthoringFingerprint(snapshot)) return null;
  return { ...plan.nextValues };
}
