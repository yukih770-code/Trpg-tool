import type { PersonalCompendiumEntryInput, PersonalCompendiumPackVersionContent } from '../api/personalCompendiumPackApiClient';

export const PERSONAL_COMPENDIUM_EXPORT_FORMAT = 'trpg-personal-compendium-pack' as const;
export const PERSONAL_COMPENDIUM_EXPORT_VERSION = 1 as const;
export const MAX_PERSONAL_COMPENDIUM_TRANSFER_CHARS = 2_500_000;

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

export type PersonalCompendiumExportEnvelope = PersonalCompendiumImportDraft & {
  format: typeof PERSONAL_COMPENDIUM_EXPORT_FORMAT;
  formatVersion: typeof PERSONAL_COMPENDIUM_EXPORT_VERSION;
  exportedAt: string;
};

export type PersonalCompendiumExportResult =
  | { ok: true; envelope: PersonalCompendiumExportEnvelope; json: string; filename: string }
  | { ok: false; message: string };

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function boundedRecord(value: unknown, maxChars = 48_000): Record<string, unknown> | undefined {
  const result = record(value);
  if (!result) return undefined;
  try {
    return JSON.stringify(result).length <= maxChars ? result : undefined;
  } catch {
    return undefined;
  }
}

function safeFilenamePart(value: string): string {
  const cleaned = value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, ' ').trim();
  return (cleaned || 'personal-content').slice(0, 80);
}

export function suggestNextPersonalCompendiumVersionLabel(current: string, existingLabels: readonly string[]): string {
  const existing = new Set(existingLabels.map((value) => value.trim()).filter(Boolean));
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current.trim());
  if (match) {
    const major = Number(match[1]);
    const minor = Number(match[2]);
    let patch = Number(match[3]) + 1;
    while (existing.has(`${major}.${minor}.${patch}`)) patch += 1;
    return `${major}.${minor}.${patch}`;
  }
  const base = `${current.trim() || 'version'}-next`;
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function createPersonalCompendiumExport(
  source: PersonalCompendiumPackVersionContent,
  exportedAt = new Date().toISOString(),
): PersonalCompendiumExportResult {
  if (!Number.isFinite(Date.parse(exportedAt))) return { ok: false, message: '导出时间无效。' };
  if (!source.pack.displayName.trim() || source.pack.displayName.trim().length > 160 || !source.version.versionLabel.trim() || source.version.versionLabel.trim().length > 80) {
    return { ok: false, message: '该版本的资料包名称或版本标签不符合导出范围。' };
  }
  if (!boundedRecord(source.pack.metadata) || source.entries.length < 1 || source.entries.length > 50) {
    return { ok: false, message: '该版本的资料包元数据或条目数量不符合导出范围。' };
  }
  for (const entry of source.entries) {
    if (!ENTRY_KINDS.has(entry.entryKind as PersonalCompendiumEntryInput['entryKind']) || !entry.displayName.trim() || entry.displayName.trim().length > 160 || !boundedRecord(entry.content) || !boundedRecord(entry.metadata)) {
      return { ok: false, message: '该版本包含无法安全导出的条目。' };
    }
  }
  const entries: PersonalCompendiumEntryInput[] = source.entries.map((entry) => ({
    entryKind: entry.entryKind as PersonalCompendiumEntryInput['entryKind'],
    displayName: entry.displayName,
    content: entry.content,
    metadata: entry.metadata,
  }));
  const envelope: PersonalCompendiumExportEnvelope = {
    format: PERSONAL_COMPENDIUM_EXPORT_FORMAT,
    formatVersion: PERSONAL_COMPENDIUM_EXPORT_VERSION,
    exportedAt,
    displayName: source.pack.displayName,
    versionLabel: source.version.versionLabel,
    metadata: source.pack.metadata,
    entries,
  };
  let json: string;
  try {
    json = JSON.stringify(envelope, null, 2);
  } catch {
    return { ok: false, message: '该版本包含无法序列化的内容，不能导出。' };
  }
  if (json.length > MAX_PERSONAL_COMPENDIUM_TRANSFER_CHARS) {
    return { ok: false, message: '该版本超过个人资料包 JSON 导出的大小上限。' };
  }
  return {
    ok: true,
    envelope,
    json,
    filename: `${safeFilenamePart(source.pack.displayName)}-${safeFilenamePart(source.version.versionLabel)}.trpg-personal.json`,
  };
}

/**
 * Client-side import is intentionally only a preview aid. The API repeats all
 * ownership, visibility, version, entry-kind, and payload-size validation.
 */
export function parsePersonalCompendiumImport(source: string): PersonalCompendiumImportResult {
  if (source.length > MAX_PERSONAL_COMPENDIUM_TRANSFER_CHARS) return { ok: false, message: '导入内容超过个人资料包 JSON 的大小上限。' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return { ok: false, message: 'JSON 格式无法读取。' };
  }

  const root = record(parsed);
  if (!root) return { ok: false, message: '导入内容必须是一个资料包对象。' };
  if (root.format !== undefined || root.formatVersion !== undefined) {
    if (root.format !== PERSONAL_COMPENDIUM_EXPORT_FORMAT) return { ok: false, message: '这不是受支持的个人资料包导出格式。' };
    if (root.formatVersion !== PERSONAL_COMPENDIUM_EXPORT_VERSION) return { ok: false, message: '该个人资料包导出版本暂不受支持。' };
    const exportedAt = text(root.exportedAt);
    if (!exportedAt || exportedAt.length > 80 || !Number.isFinite(Date.parse(exportedAt))) return { ok: false, message: '个人资料包缺少有效的导出时间。' };
  }
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
    const content = entry?.content === undefined ? undefined : boundedRecord(entry.content);
    const metadata = entry?.metadata === undefined ? undefined : boundedRecord(entry.metadata);
    if ((entry?.content !== undefined && !content) || (entry?.metadata !== undefined && !metadata)) {
      return { ok: false, message: '条目的 content 和 metadata 必须是对象。' };
    }
    entries.push({ entryKind, displayName: entryName, content, metadata });
  }

  const versionLabel = text(root.versionLabel);
  if (versionLabel && versionLabel.length > 80) return { ok: false, message: '版本标签不能超过 80 个字符。' };
  const metadata = root.metadata === undefined ? undefined : boundedRecord(root.metadata);
  if (root.metadata !== undefined && !metadata) return { ok: false, message: '资料包 metadata 必须是对象。' };
  return { ok: true, draft: { displayName, versionLabel, metadata, entries } };
}
