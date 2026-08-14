import type { AiRouteMode } from './modelRoutingTypes.js';
import type { DndPersonalEditorEntryKind } from '../dnd/dndPersonalContentDefinitions.js';

export const DND_PERSONAL_CONTENT_ASSISTANT_ENTRY_KINDS = [
  'species', 'class', 'subclass', 'background', 'feat', 'spell', 'item', 'monster', 'rule', 'other',
] as const satisfies readonly DndPersonalEditorEntryKind[];

export const DND_PERSONAL_CONTENT_ASSISTANT_FIELD_KEYS = [
  'entryName', 'summary', 'ruleResources', 'ruleActions', 'ruleChoices', 'ruleTriggers',
  'size', 'speed', 'traits', 'heritageOptions', 'speciesLanguages', 'speciesSenses', 'speciesAbilityOptions',
  'backgroundSkills', 'backgroundTools', 'backgroundEquipment', 'backgroundLanguages', 'featureName', 'featureDescription',
  'classPrimaryAbility', 'classHitDice', 'classSavingThrows', 'classWeaponProficiencies', 'classArmorProficiencies',
  'classStartingEquipment', 'classFeatureLines', 'classSkillChoices', 'classSkillChoiceCount', 'classToolChoices',
  'classSpellcastingProgression', 'classMulticlassNote',
  'subclassParentClass', 'subclassUnlockLevel', 'subclassFeatureLines',
  'featCategory', 'prerequisite',
  'spellLevel', 'spellSchool', 'spellCastTime', 'spellRange', 'spellDuration', 'spellComponents',
  'spellTarget', 'spellSave', 'spellArea', 'spellEffect', 'spellScaling',
  'itemCategory', 'itemRarity', 'itemWeight', 'itemCost', 'itemDamage', 'itemDamageType', 'itemProperties',
  'itemArmorClass', 'itemUsage', 'itemAttunement', 'itemCharges', 'itemRequirements', 'itemEffects',
  'monsterSize', 'monsterType', 'monsterAlignment', 'monsterArmorClass', 'monsterHp', 'monsterSpeed',
  'monsterChallenge', 'monsterTraits', 'monsterActions', 'monsterReactions', 'monsterLegendaryActions',
  'monsterAbilityScores', 'monsterSavingThrows', 'monsterSkills', 'monsterDamageVulnerabilities',
  'monsterDamageResistances', 'monsterDamageImmunities', 'monsterConditionImmunities', 'monsterSenses',
  'monsterLanguages', 'monsterProficiencyBonus',
] as const;

export type DndPersonalContentAssistantFieldKey = typeof DND_PERSONAL_CONTENT_ASSISTANT_FIELD_KEYS[number];
export type DndPersonalContentAssistantFieldValues = Partial<Record<DndPersonalContentAssistantFieldKey, string>>;

const COMMON_FIELDS = ['entryName', 'summary', 'ruleResources', 'ruleActions', 'ruleChoices', 'ruleTriggers'] as const;

export const DND_PERSONAL_CONTENT_ASSISTANT_FIELDS_BY_KIND: Record<DndPersonalEditorEntryKind, readonly DndPersonalContentAssistantFieldKey[]> = {
  species: [...COMMON_FIELDS, 'size', 'speed', 'traits', 'heritageOptions', 'speciesLanguages', 'speciesSenses', 'speciesAbilityOptions'],
  background: [...COMMON_FIELDS, 'backgroundSkills', 'backgroundTools', 'backgroundEquipment', 'backgroundLanguages', 'featureName', 'featureDescription'],
  class: [...COMMON_FIELDS, 'classPrimaryAbility', 'classHitDice', 'classSavingThrows', 'classWeaponProficiencies', 'classArmorProficiencies', 'classStartingEquipment', 'classFeatureLines', 'classSkillChoices', 'classSkillChoiceCount', 'classToolChoices', 'classSpellcastingProgression', 'classMulticlassNote'],
  subclass: [...COMMON_FIELDS, 'subclassParentClass', 'subclassUnlockLevel', 'subclassFeatureLines'],
  feat: [...COMMON_FIELDS, 'featCategory', 'prerequisite'],
  spell: [...COMMON_FIELDS, 'spellLevel', 'spellSchool', 'spellCastTime', 'spellRange', 'spellDuration', 'spellComponents', 'spellTarget', 'spellSave', 'spellArea', 'spellEffect', 'spellScaling'],
  item: [...COMMON_FIELDS, 'itemCategory', 'itemRarity', 'itemWeight', 'itemCost', 'itemDamage', 'itemDamageType', 'itemProperties', 'itemArmorClass', 'itemUsage', 'itemAttunement', 'itemCharges', 'itemRequirements', 'itemEffects'],
  monster: [...COMMON_FIELDS, 'monsterSize', 'monsterType', 'monsterAlignment', 'monsterArmorClass', 'monsterHp', 'monsterSpeed', 'monsterChallenge', 'monsterTraits', 'monsterActions', 'monsterReactions', 'monsterLegendaryActions', 'monsterAbilityScores', 'monsterSavingThrows', 'monsterSkills', 'monsterDamageVulnerabilities', 'monsterDamageResistances', 'monsterDamageImmunities', 'monsterConditionImmunities', 'monsterSenses', 'monsterLanguages', 'monsterProficiencyBonus'],
  rule: COMMON_FIELDS,
  other: COMMON_FIELDS,
};

export type DndPersonalContentAssistantRequest = {
  intent: string;
  locale: 'zh-CN' | 'en';
  draft: {
    entryKind: DndPersonalEditorEntryKind;
    values: DndPersonalContentAssistantFieldValues;
  };
};

export type DndPersonalContentAssistantSuggestion = {
  version: 1;
  entryKind: DndPersonalEditorEntryKind;
  proposalSummary: string;
  fieldValues: Array<{ field: DndPersonalContentAssistantFieldKey; value: string }>;
  rationale: string[];
  warnings: string[];
};

export type DndPersonalContentAssistantGatewayResult = {
  suggestionId: string;
  provider: 'ollama';
  route: Extract<AiRouteMode, 'local'>;
  model: string;
  createdAt: number;
  suggestion: DndPersonalContentAssistantSuggestion;
};

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null;
}

function boundedText(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const result = value.trim();
  return result && result.length <= max ? result : undefined;
}

function isEntryKind(value: unknown): value is DndPersonalEditorEntryKind {
  return typeof value === 'string' && (DND_PERSONAL_CONTENT_ASSISTANT_ENTRY_KINDS as readonly string[]).includes(value);
}

function isFieldKey(value: unknown): value is DndPersonalContentAssistantFieldKey {
  return typeof value === 'string' && (DND_PERSONAL_CONTENT_ASSISTANT_FIELD_KEYS as readonly string[]).includes(value);
}

export function parseDndPersonalContentAssistantSuggestion(value: unknown): DndPersonalContentAssistantSuggestion | null {
  const source = record(value);
  if (!source || source.version !== 1 || !isEntryKind(source.entryKind)) return null;
  if (!Object.keys(source).every((key) => ['version', 'entryKind', 'proposalSummary', 'fieldValues', 'rationale', 'warnings'].includes(key))) return null;
  const proposalSummary = boundedText(source.proposalSummary, 500);
  if (!proposalSummary || !Array.isArray(source.fieldValues) || source.fieldValues.length > 50) return null;
  if (!Array.isArray(source.rationale) || source.rationale.length > 8 || !Array.isArray(source.warnings) || source.warnings.length > 8) return null;

  const rationale = source.rationale.map((item) => boundedText(item, 500));
  const warnings = source.warnings.map((item) => boundedText(item, 500));
  if (rationale.some((item) => !item) || warnings.some((item) => !item)) return null;

  let totalLength = 0;
  const seen = new Set<DndPersonalContentAssistantFieldKey>();
  const fieldValues: DndPersonalContentAssistantSuggestion['fieldValues'] = [];
  for (const item of source.fieldValues) {
    const fieldSource = record(item);
    if (!fieldSource || !Object.keys(fieldSource).every((key) => key === 'field' || key === 'value')) return null;
    if (!isFieldKey(fieldSource.field) || seen.has(fieldSource.field)) return null;
    const fieldValue = boundedText(fieldSource.value, 4_000);
    if (!fieldValue) return null;
    totalLength += fieldValue.length;
    if (totalLength > 32_000) return null;
    seen.add(fieldSource.field);
    fieldValues.push({ field: fieldSource.field, value: fieldValue });
  }

  return {
    version: 1,
    entryKind: source.entryKind,
    proposalSummary,
    fieldValues,
    rationale: rationale as string[],
    warnings: warnings as string[],
  };
}

export const DND_PERSONAL_CONTENT_ASSISTANT_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['version', 'entryKind', 'proposalSummary', 'fieldValues', 'rationale', 'warnings'],
  properties: {
    version: { type: 'integer', const: 1 },
    entryKind: { type: 'string', enum: DND_PERSONAL_CONTENT_ASSISTANT_ENTRY_KINDS },
    proposalSummary: { type: 'string', minLength: 1, maxLength: 500 },
    fieldValues: {
      type: 'array',
      maxItems: 50,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['field', 'value'],
        properties: {
          field: { type: 'string', enum: DND_PERSONAL_CONTENT_ASSISTANT_FIELD_KEYS },
          value: { type: 'string', minLength: 1, maxLength: 4_000 },
        },
      },
    },
    rationale: { type: 'array', maxItems: 8, items: { type: 'string', minLength: 1, maxLength: 500 } },
    warnings: { type: 'array', maxItems: 8, items: { type: 'string', minLength: 1, maxLength: 500 } },
  },
} as const;
