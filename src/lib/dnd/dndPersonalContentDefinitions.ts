/**
 * Small, declarative contracts shared by the personal DND content workbench.
 * They describe authored facts only. Runtime effects and rule execution remain
 * outside of personal content until a Room host approves a concrete version.
 */

export type DndPersonalEditorEntryKind =
  | 'species'
  | 'class'
  | 'subclass'
  | 'background'
  | 'feat'
  | 'spell'
  | 'item'
  | 'monster'
  | 'rule'
  | 'other';

export type DndPersonalFeatureDraft = {
  unlockLevel: number;
  name: string;
  desc: string;
};

export type DndPersonalNamedRuleDraft = {
  name: string;
  desc: string;
};

/** A declared resource, for example spell slots, charges, ki, or Soul Thread. */
export type DndPersonalResourceDraft = {
  name: string;
  maximum: string;
  recovery: string;
  desc: string;
};

/** A declared action fact. It is intentionally not an executable Runtime intent. */
export type DndPersonalActionDraft = {
  name: string;
  activation: string;
  range: string;
  cost: string;
  desc: string;
};

/** A bounded choice group, such as an invocation, ancestry, fighting style, or item mode. */
export type DndPersonalChoiceDraft = {
  name: string;
  requirement: string;
  selection: string;
  options: string[];
};

export type DndPersonalRuleComponents = {
  resources: DndPersonalResourceDraft[];
  actions: DndPersonalActionDraft[];
  choices: DndPersonalChoiceDraft[];
  triggers: DndPersonalNamedRuleDraft[];
};

function boundedLevel(value: string, fallback: number): number {
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 20 ? parsed : fallback;
}

/**
 * One feature per line: `等级 | 名称 | 说明`.
 * A missing or invalid level falls back to the caller-provided value, so an
 * author can use `名称 | 说明` for a group that shares one unlock level.
 */
export function parseDndPersonalFeatureLines(value: string, fallbackLevel = 1, limit = 40): DndPersonalFeatureDraft[] {
  return value.split('\n').flatMap((line) => {
    const parts = line.split('|').map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) return [];
    const hasExplicitLevel = /^\d+$/.test(parts[0] ?? '');
    const name = hasExplicitLevel ? parts[1] : parts[0];
    const desc = hasExplicitLevel ? parts.slice(2).join(' | ') : parts.slice(1).join(' | ');
    if (!name || !desc) return [];
    return [{ unlockLevel: hasExplicitLevel ? boundedLevel(parts[0], fallbackLevel) : fallbackLevel, name, desc }];
  }).slice(0, limit);
}

/** One named rule per line: `名称 | 说明`. Used for traits and creature actions. */
export function parseDndPersonalNamedRuleLines(value: string, limit = 40): DndPersonalNamedRuleDraft[] {
  return value.split('\n').flatMap((line) => {
    const parts = line.split('|').map((part) => part.trim()).filter(Boolean);
    const name = parts[0];
    const desc = parts.slice(1).join(' | ');
    return name && desc ? [{ name, desc }] : [];
  }).slice(0, limit);
}

/** One resource per line: `名称 | 上限或公式 | 恢复 | 说明`. */
export function parseDndPersonalResourceLines(value: string, limit = 20): DndPersonalResourceDraft[] {
  return value.split('\n').flatMap((line) => {
    const parts = line.split('|').map((part) => part.trim());
    const [name, maximum, recovery, ...description] = parts;
    if (!name || !maximum || !recovery) return [];
    return [{ name, maximum, recovery, desc: description.filter(Boolean).join(' | ') }];
  }).slice(0, limit);
}

/** One action per line: `名称 | 动作类型 | 射程 | 消耗 | 说明`. */
export function parseDndPersonalActionLines(value: string, limit = 40): DndPersonalActionDraft[] {
  return value.split('\n').flatMap((line) => {
    const parts = line.split('|').map((part) => part.trim());
    const [name, activation, range, cost, ...description] = parts;
    if (!name || !activation) return [];
    return [{ name, activation, range: range || '未说明', cost: cost || '无', desc: description.filter(Boolean).join(' | ') }];
  }).slice(0, limit);
}

/** One choice group per line: `名称 | 前置条件 | 选择数量 | 选项 1；选项 2`. */
export function parseDndPersonalChoiceLines(value: string, limit = 20): DndPersonalChoiceDraft[] {
  return value.split('\n').flatMap((line) => {
    const parts = line.split('|').map((part) => part.trim());
    const [name, requirement, selection, optionText] = parts;
    if (!name || !optionText) return [];
    const options = optionText.split(/[；;]/).map((option) => option.trim()).filter(Boolean).slice(0, 20);
    return options.length > 0 ? [{ name, requirement: requirement || '无', selection: selection || '选择一项', options }] : [];
  }).slice(0, limit);
}

export function parseDndPersonalRuleComponents(input: {
  resources: string;
  actions: string;
  choices: string;
  triggers: string;
}): DndPersonalRuleComponents {
  return {
    resources: parseDndPersonalResourceLines(input.resources),
    actions: parseDndPersonalActionLines(input.actions),
    choices: parseDndPersonalChoiceLines(input.choices),
    triggers: parseDndPersonalNamedRuleLines(input.triggers),
  };
}

/**
 * Packs remain the immutable storage/version container, but ordinary one-off
 * authoring does not make a player name that container. Its title is derived
 * from the entries they actually created.
 */
export function deriveDndPersonalLibraryName(entries: ReadonlyArray<{ displayName: string }>): string {
  const first = entries.find((entry) => entry.displayName.trim())?.displayName.trim();
  if (!first) return '我的 DND 自定义资料';
  if (entries.length === 1) return first;
  return `${first} 等 ${entries.length} 项 DND 自定义资料`;
}
