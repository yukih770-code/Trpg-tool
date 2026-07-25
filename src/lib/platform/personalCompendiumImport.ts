import type { PersonalCompendiumEntryInput } from '../api/personalCompendiumPackApiClient';

const ENTRY_KINDS = new Set<PersonalCompendiumEntryInput['entryKind']>([
  'species', 'speciesOption', 'class', 'subclass', 'background', 'feat', 'spell', 'item', 'monster', 'rule', 'other',
]);

export type PersonalCompendiumImportDraft = {
  displayName: string;
  versionLabel?: string;
  metadata?: Record<string, unknown>;
  entries: PersonalCompendiumEntryInput[];
};

export type PersonalCompendiumImportResult =
  | { ok: true; draft: PersonalCompendiumImportDraft }
  | { ok: false; message: string };

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

/**
 * Client-side import is intentionally only a preview aid. The API repeats all
 * ownership, visibility, version, entry-kind, and payload-size validation.
 */
export function parsePersonalCompendiumImport(source: string): PersonalCompendiumImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return { ok: false, message: 'JSON 格式无法读取。' };
  }

  const root = record(parsed);
  if (!root) return { ok: false, message: '导入内容必须是一个资料包对象。' };
  const displayName = text(root.displayName);
  if (!displayName || displayName.length > 160) return { ok: false, message: '资料包名称需要为 1 至 160 个字符。' };
  if (!Array.isArray(root.entries) || root.entries.length < 1 || root.entries.length > 50) {
    return { ok: false, message: '资料包需要包含 1 至 50 个条目。' };
  }

  const entries: PersonalCompendiumEntryInput[] = [];
  for (const rawEntry of root.entries) {
    const entry = record(rawEntry);
    const entryKind = text(entry?.entryKind) as PersonalCompendiumEntryInput['entryKind'] | undefined;
    const entryName = text(entry?.displayName);
    if (!entryKind || !ENTRY_KINDS.has(entryKind) || !entryName || entryName.length > 160) {
      return { ok: false, message: '每个条目都需要有效的类型和 1 至 160 个字符的名称。' };
    }
    const content = entry?.content === undefined ? undefined : record(entry.content);
    const metadata = entry?.metadata === undefined ? undefined : record(entry.metadata);
    if ((entry?.content !== undefined && !content) || (entry?.metadata !== undefined && !metadata)) {
      return { ok: false, message: '条目的 content 和 metadata 必须是对象。' };
    }
    entries.push({ entryKind, displayName: entryName, content, metadata });
  }

  const versionLabel = text(root.versionLabel);
  if (versionLabel && versionLabel.length > 80) return { ok: false, message: '版本标签不能超过 80 个字符。' };
  const metadata = root.metadata === undefined ? undefined : record(root.metadata);
  if (root.metadata !== undefined && !metadata) return { ok: false, message: '资料包 metadata 必须是对象。' };
  return { ok: true, draft: { displayName, versionLabel, metadata, entries } };
}
