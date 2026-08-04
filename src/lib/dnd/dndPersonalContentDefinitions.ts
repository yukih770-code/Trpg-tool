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
  | 'monster';

export type DndPersonalFeatureDraft = {
  unlockLevel: number;
  name: string;
  desc: string;
};

export type DndPersonalNamedRuleDraft = {
  name: string;
  desc: string;
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
